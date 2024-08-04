"use client";

import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { Camera } from "react-camera-pro";
import React, { useState, useRef } from "react";
import { storage, firestore } from "@/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import * as dotenv from 'dotenv'
import OpenAI from 'openai';

dotenv.config()


const Component = () => {
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [quantity, setQuantity] = useState(1);

  const openai = new OpenAI({
  })

  const takeAndUploadPhoto = async () => {
    const photo = camera.current.takePhoto();
    setImage(photo);
    const imageUrl = await uploadPhotoToFirebase(photo);
    const { classifiedLabel, classifiedQuantity } = await classifyImage(imageUrl);
    setLabel(classifiedLabel);
    setQuantity(classifiedQuantity);
    setOpen(true);
  };

  const uploadPhotoToFirebase = async (photo) => {
    try {
      const storageRef = ref(storage, `photos/${Date.now()}.jpg`);
      await uploadString(storageRef, photo, "data_url");
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading photo: ", error);
    }
  };

  const classifyImage = async (imageUrl) => {
    try {

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `You are a highly trained classifier. Given the image URL provided, classify the object in the image and provide the following details:

            1. The label of the object (e.g., "apple").
            2. The quantity of the object (e.g., "5").
            
            Response format:
            Label: <label>, Quantity: <quantity>
            
            Image URL: ${imageUrl}
            `,
          },
        ],
        model: "gpt-4-preview-version",
      });
      const response = completion.choices[0].message.content.trim();
      console.log('API Response:', response);
      const [classifiedLabel, classifiedQuantity] = parseClassificationResponse(response);
      return { classifiedLabel, classifiedQuantity };
    } catch (error) {
      console.error("Error classifying image: ", error);
    }
  };

  const parseClassificationResponse = (response) => {
    // Assuming response format is "Label: <label>, Quantity: <quantity>"
    const labelMatch = response.match(/Label:\s*([^,]+)/);
    const quantityMatch = response.match(/Quantity:\s*(\d+)/);
    const classifiedLabel = labelMatch ? labelMatch[1].trim() : "Unknown";
    const classifiedQuantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
    return [classifiedLabel, classifiedQuantity];
  };

  const updateInventory = async (label, quantity) => {
    try {
      const docRef = doc(collection(firestore, "Inventory"), label);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity: existingQuantity } = docSnap.data();
        await setDoc(docRef, { quantity: existingQuantity + quantity });
      } else {
        await setDoc(docRef, { quantity });
      }
    } catch (error) {
      console.error("Error updating inventory: ", error);
    }
  };

  const handleConfirm = async () => {
    await updateInventory(label, quantity);
    setOpen(false);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={5}
      bgcolor="black"
    >
      <Box
        width="80%"
        height="80%"
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap={5}
      >
        <Camera ref={camera} aspectRatio={16 / 9} />
        <div
          style={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "10px",
            margin: "10px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button onClick={takeAndUploadPhoto} variant="contained">
            Take Photo
          </Button>
          <Button variant="contained" onClick={() => (window.location.href = "http://localhost:3000")}>
            Go Back
          </Button>
          {image && (
            <Box mt={2} width="100%" display="flex" justifyContent="center" alignItems="center">
              <img src={image} alt="Image preview" style={{ width: "100%", height: "auto" }} />
            </Box>
          )}
        </div>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Classification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The classified label for the item is <strong>{label}</strong> with a quantity of <strong>{quantity}</strong>. Is this correct?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Component;
