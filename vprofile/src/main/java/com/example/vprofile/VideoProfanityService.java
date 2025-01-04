package com.example.vprofile;

import java.io.File;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VideoProfanityService {

    @Autowired
    private ProfanityService profanityService;

    public Boolean analyzeVideo(Long userId, Long videoId, String videoPath) throws Exception {
        String framesDir = null;
        try {
            // Extract frames
            FrameExtractor extractor = new FrameExtractor();
            framesDir = extractor.extractFrames(videoPath);

            // Analyze frames for profanity
            ProfanityChecker checker = new ProfanityChecker();
            boolean containsProfanity = checker.checkVideoForProfanity(framesDir);

            // Save the result
            profanityService.saveProfanity(userId, videoId, containsProfanity);

            return containsProfanity;
        } finally {
            // Cleanup extracted frames
            if (framesDir != null) {
                cleanupFrames(framesDir);
            }
        }
    }

    private void cleanupFrames(String framesDir) {
        File folder = new File(framesDir);
        if (folder.exists()) {
            for (File file : folder.listFiles()) {
                file.delete();
            }
            folder.delete();
        }
    }
}
