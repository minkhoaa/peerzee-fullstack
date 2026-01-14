// upload.controller.ts
import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class UploadController {
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return { error: 'No file received' };
        }
        return {
            fileUrl: `/uploads/${file.filename}`,
            fileName: file.originalname,
            fileType: file.mimetype,
        };
    }
}