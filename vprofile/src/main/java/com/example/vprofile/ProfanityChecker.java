package com.example.vprofile;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import com.google.api.gax.core.FixedCredentialsProvider;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class ProfanityChecker {

    private static final String CREDENTIALS_PATH = "D:\\work\\WEB_IN_TEK\\vprofile\\bin\\service-account.json";

    public static GoogleCredentials getCredentials() throws IOException {
        return GoogleCredentials.fromStream(new FileInputStream(CREDENTIALS_PATH))
                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
    }

    public boolean isOffensive(String imagePath) throws Exception {
        ByteString imgBytes = ByteString.copyFrom(Files.readAllBytes(Paths.get(imagePath)));

        Image img = Image.newBuilder().setContent(imgBytes).build();
        Feature feature = Feature.newBuilder().setType(Feature.Type.SAFE_SEARCH_DETECTION).build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feature)
                .setImage(img)
                .build();

        // Explicitly create the ImageAnnotatorClient with credentials
        try (ImageAnnotatorClient vision = ImageAnnotatorClient.create(
                ImageAnnotatorSettings.newBuilder()
                        .setCredentialsProvider(FixedCredentialsProvider.create(getCredentials()))
                        .build())) {

            AnnotateImageResponse response = vision.batchAnnotateImages(
                    java.util.Arrays.asList(request)).getResponses(0);

            SafeSearchAnnotation annotation = response.getSafeSearchAnnotation();

            if (annotation == null) {
                System.out.println("No SafeSearch annotation found.");
                return false;
            }

            return annotation.getAdultValue() >= Likelihood.LIKELY_VALUE ||
                   annotation.getViolenceValue() >= Likelihood.LIKELY_VALUE;
        }
    }

    public boolean checkVideoForProfanity(String framesDir) throws Exception {
        File folder = new File(framesDir);
        File[] files = folder.listFiles();

        if (files == null || files.length == 0) {
            System.out.println("No frames found for analysis.");
            return false;
        }

        for (File file : files) {
            if (file.isFile() && file.getName().endsWith(".jpg")) {
                if (isOffensive(file.getAbsolutePath())) {
                    System.out.println("Offensive content found in: " + file.getName());
                    return true;
                }
            }
        }

        System.out.println("No offensive content found in video.");
        return false;
    }
}
