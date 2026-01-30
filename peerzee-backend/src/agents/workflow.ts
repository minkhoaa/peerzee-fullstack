import { Injectable, Logger } from '@nestjs/common';
import { MatchState, createInitialMatchState } from './matchState';
import { MatchNodes } from './matchNodes';

/**
 * RAG Matchmaker Agent - Workflow Orchestration
 * Executes the 3-node graph: parse -> retrieve -> curate
 */
@Injectable()
export class MatchWorkflow {
    private readonly logger = new Logger(MatchWorkflow.name);

    constructor(private readonly nodes: MatchNodes) { }

    /**
     * Execute the full matchmaking workflow
     * Returns the final state with match result
     */
    async runWorkflow(userQuery: string, userId: string): Promise<MatchState> {
        this.logger.log(`Starting RAG Matchmaker for: "${userQuery}"`);

        // Initialize state
        let state = createInitialMatchState(userQuery, userId);

        try {
            // Node 1: Parse Intent
            this.logger.log('NODE 1: Parse Intent');
            const parseResult = await this.nodes.parseIntentNode(state);
            state = { ...state, ...parseResult };

            // Node 2: Retrieve Candidates
            this.logger.log('NODE 2: Retrieve Candidates');
            const retrieveResult = await this.nodes.retrieveCandidatesNode(state);
            state = { ...state, ...retrieveResult };

            // Node 3: RAG Curate Match
            this.logger.log('NODE 3: RAG Curate Match');
            const ragResult = await this.nodes.curateMatchNode(state);
            state = { ...state, ...ragResult };

            this.logger.log(`Workflow complete. Match: ${state.finalMatch?.profile.display_name || 'None'}`);

        } catch (error) {
            this.logger.error('Workflow failed', error);
            state.error = error.message || 'Workflow execution failed';
            state.currentStep = 'ERROR';
        }

        return state;
    }

    /**
     * Execute workflow with step-by-step callbacks for streaming UI
     */
    async runWorkflowWithProgress(
        userQuery: string,
        userId: string,
        onStep: (step: string, state: Partial<MatchState>) => void,
    ): Promise<MatchState> {
        let state = createInitialMatchState(userQuery, userId);

        try {
            // Node 1
            onStep('PARSING INTENT...', { currentStep: 'PARSING' });
            const parseResult = await this.nodes.parseIntentNode(state);
            state = { ...state, ...parseResult };
            onStep(`Filters: ${JSON.stringify(state.filters)}`, { filters: state.filters });

            // Node 2
            onStep('SCANNING DATABASE...', { currentStep: 'RETRIEVING' });
            const retrieveResult = await this.nodes.retrieveCandidatesNode(state);
            state = { ...state, ...retrieveResult };
            onStep(`Found ${state.candidates.length} candidates`, { candidates: state.candidates });

            // Node 3
            onStep('ANALYZING PROFILES...', { currentStep: 'CURATING' });
            const ragResult = await this.nodes.curateMatchNode(state);
            state = { ...state, ...ragResult };
            onStep('MATCH FOUND!', { finalMatch: state.finalMatch });

        } catch (error) {
            state.error = error.message;
            onStep('ERROR', { error: error.message });
        }

        return state;
    }
}
