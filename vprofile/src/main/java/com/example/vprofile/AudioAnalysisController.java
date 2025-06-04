package com.example.vprofile;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audio")
public class AudioAnalysisController {
    @Autowired
    private  AudioAnalysisService audioAnalysisService;

    @Autowired
    private SpeechScoreService speechScoreService;

  @GetMapping("/analyze")
public SpeechScore analyzeAudio(
        @RequestParam Long videoId,
        @RequestParam(name = "filePath") String audioUrl // Keep name as filePath for backward compatibility
) {
    try {
        // Fallback-safe check for whether analysis has already been performed
        boolean alreadyAnalyzed = false;
        try {
            alreadyAnalyzed = speechScoreService.isAnalysisAlreadyPerformed(videoId);
        } catch (Exception e) {
            System.out.println("Fallback: Could not check if analysis was already performed. Proceeding with analysis.");
        }

        if (alreadyAnalyzed) {
            throw new RuntimeException("Analysis has already been performed for this video.");
        }

        // Proceed with the analysis
        return audioAnalysisService.analyzeAudio(audioUrl, videoId);

    } catch (Exception e) {
        throw new RuntimeException("Error during audio analysis: " + e.getMessage(), e);
    }
}


}
