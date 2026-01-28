
const axios = require('axios');

const API_URL = 'http://localhost:9000/api';
const CREDENTIALS = {
    email: 'test1@gmail.com',
    password: 'Khoa040505@',
    device: 'probe-script'
};

async function probe() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/user/login`, CREDENTIALS);
        const { token, user_id } = loginRes.data;
        console.log('✅ Login successful. Token obtained.');

        console.log('2. Fetching Profile...');
        const profileRes = await axios.get(`${API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profile = profileRes.data;
        console.log('✅ Profile fetched.');

        // Verify existing bioEmbedding (might be empty initially)
        if (profile.bioEmbedding) {
            console.log(`ℹ️ Existing Bio Embedding found. Length: ${profile.bioEmbedding.length}`);
        } else {
            console.log('ℹ️ No existing bioEmbedding.');
        }

        console.log('3. Updating Profile (to generate vector)...');
        // Update bio to trigger vector generation
        try {
            const updateRes = await axios.patch(`${API_URL}/profile/me`, {
                bio: `I am a software engineer looking for deep connections. ${Date.now()}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Update complete:', updateRes.status);

            // Wait a bit for async vector generation if it were async (it's sync in code but good practice)
            await new Promise(r => setTimeout(r, 1000));

            // Fetch profile again to see if vector updated
            const profileRes2 = await axios.get(`${API_URL}/profile/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profileRes2.data.bioEmbedding) {
                const vec = profileRes2.data.bioEmbedding;
                console.log(`✅ Bio Embedding present after update. Length: ${vec.length}`);

                // VALIDATION: Check if it is an array of numbers
                if (Array.isArray(vec) && vec.length > 0 && typeof vec[0] === 'number') {
                    console.log('✅ Vector validation PASSED: Array of numbers confirmed.');
                } else {
                    console.error('❌ Vector validation FAILED: Not an array of numbers. Type:', typeof vec);
                    console.error('Value sample:', vec.slice(0, 5));
                }
            } else {
                console.error('❌ Bio Embedding execution finished but NO vector found in response.');
            }
        } catch (err) {
            console.error('❌ Update failed:', err.response ? err.response.data : err.message);
        }

    } catch (error) {
        console.error('❌ Probe failed:', error.code || error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

probe();
