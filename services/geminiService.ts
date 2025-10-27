
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { OutfitDescription } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
  
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const generateOutfitIdeas = async (file: File): Promise<OutfitDescription[]> => {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `You are a world-class fashion stylist. Analyze the provided image of a single clothing item. Based on its style, color, and pattern, create three distinct, complete outfit descriptions. The categories for the outfits are 'Casual', 'Business', and 'Night Out'.

For each category, provide a detailed description of the other clothing items and accessories that would complete the look. The description should be detailed enough to be used as a prompt for an AI image generator to create a flat-lay image of the outfit. The original item from the image must be included in each outfit description.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["category", "description"]
                }
            }
        }
    });

    const jsonText = response.text.trim();
    try {
        const parsedResponse = JSON.parse(jsonText);
        return parsedResponse as OutfitDescription[];
    } catch(e) {
        console.error("Failed to parse JSON from Gemini:", jsonText);
        throw new Error("Received an invalid format from the AI stylist.");
    }
};

export const generateOutfitImage = async (description: string): Promise<{ base64Image: string; mimeType: string }> => {
    const prompt = `A clean, minimalist, flat-lay photograph of a complete women's outfit arranged neatly on a solid light gray background. The outfit consists of: ${description}. The style should be modern and chic. Studio lighting.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts[0];
    if (firstPart && firstPart.inlineData) {
        return {
            base64Image: firstPart.inlineData.data,
            mimeType: firstPart.inlineData.mimeType
        };
    }
    throw new Error("Could not generate outfit image.");
};

export const editOutfitImage = async (base64Image: string, mimeType: string, prompt: string): Promise<{ base64Image: string; mimeType: string }> => {
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };

    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const firstPart = response.candidates?.[0]?.content?.parts[0];
    if (firstPart && firstPart.inlineData) {
        return {
            base64Image: firstPart.inlineData.data,
            mimeType: firstPart.inlineData.mimeType
        };
    }
    throw new Error("Could not edit outfit image.");
};
