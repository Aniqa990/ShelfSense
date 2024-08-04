"use client";
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
} from "@mui/material";
import { firestore } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import Component from "./camera"
import Groq from "groq-sdk";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "white",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
})

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));



export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCamera, setOpenCamera] = useState(false);
  const [openRecipes, setOpenRecipes] = useState(false);
  const [itemName, setItemName] = useState("");
  const [Quantity, setQuantity] = useState(1);
  const [originalItemName, setOriginalItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInventory, setFilteredInventory] = useState([]);

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => setOpenEdit(false);

  const handleOpenCamera = () => setOpenCamera(true);
  const handleCloseCamera = () => setOpenCamera(false);

  const handleOpenRecipes = () => setOpenRecipes(true);
  const handleCloseRecipes = () => setOpenRecipes(false);

  const handleEdit = (name, quantity) => {
    setOriginalItemName(name);
    setItemName(name);
    setQuantity(quantity);
    handleOpenEdit();
  };

  async function fetchRecipes() {
    const snapshot = query(collection(firestore, "Inventory")); //'Inventory' is name of database in firebase
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });

  const inventoryString = inventoryList.map(item => `${item.name}: ${item.quantity}`).join(', ');

  const promptMessage = `Generate recipes using the following inventory items: ${inventoryString}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: promptMessage,
      },
    ],
    model: "llama3-8b-8192",
  });

  return completion.choices[0].message.content;
}


  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "Inventory")); //'Inventory' is name of database in firebase
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    console.log(inventoryList);
    setInventory(inventoryList);
  };

  const addItem = async (item, add_quantity) => {
    const docRef = doc(collection(firestore, "Inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + add_quantity });
    } else {
      await setDoc(docRef, { quantity: add_quantity });
    }
    await updateInventory();
  };

  const editItem = async (originalItemName, newItemName, newQuantity) => {
    if (originalItemName !== newItemName) {
      const originalDocRef = doc(
        collection(firestore, "Inventory"),
        originalItemName
      );
      await deleteDoc(originalDocRef);
    }

    const newDocRef = doc(collection(firestore, "Inventory"), newItemName);
    const updatedQuantity = Number(newQuantity);

    await setDoc(newDocRef, { quantity: updatedQuantity });
    await updateInventory();
  };

  const decrease = async (item) => {
    const docRef = doc(collection(firestore, "Inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const increase = async (item) => {
    const docRef = doc(collection(firestore, "Inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "Inventory"), item);

    await deleteDoc(docRef);
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredInventory(inventory);
    } else {
      setFilteredInventory(
        inventory.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, inventory]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display={"flex"}
      justifyContent={"center"}
      flexDirection={"column"}
      alignItems={"center"}
    >
      <Box
        sx={{ flexGrow: 1 }}
        width="60vw"
        minHeight="100px"
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        paddingX={5}
      >
        <AppBar position="relative">
          <Toolbar>
            <Box
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search…"
                  inputProps={{ "aria-label": "search" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Search>

              <Modal
                open={openAdd}
                onClose={handleCloseAdd}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={style}>
                  <Typography
                    id="modal-modal-title"
                    variant="h6"
                    component="h2"
                  >
                    Add Item
                  </Typography>
                  <Stack width="100%" direction={"row"} spacing={2}>
                    <TextField
                      id="outlined-basic"
                      label="Item"
                      variant="outlined"
                      fullWidth
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />

                    <TextField
                      id="outlined-basic"
                      label="Quantity"
                      variant="outlined"
                      fullWidth
                      value={Quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />

                    <Button
                      variant="outlined"
                      onClick={() => {
                        addItem(itemName, Number(Quantity));
                        setItemName("");
                        handleCloseAdd();
                      }}
                    >
                      Add
                    </Button>
                  </Stack>
                </Box>
              </Modal>

              <Button
                variant="contained"
                onClick={handleOpenAdd}
                sx={{ marginLeft: 2 }}
              >
                Add New Item
              </Button>

              <Modal
                open={openRecipes}
                onClose={handleCloseRecipes}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={{ 
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "80vw",
                  height: "80vh",
                  bgcolor: "white",
                  border: "2px solid #000",
                  boxShadow: 24,
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  justifyContent: "center",
                  alignItems: "center"
                  }}>
                  <Box sx={{width: "90%", height: "90%", overflow: "auto"}}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                      Generated Recipes
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                      {fetchRecipes() || 'Loading...'}
                    </Typography>
                  </Box>

                    <Button
                      variant="outlined"
                      onClick={() => {
                        handleCloseRecipes();
                      }}
                    >
                      Close
                    </Button>
                </Box>
              </Modal>

              <Button
                variant="contained"
                onClick={handleOpenRecipes}
                sx={{ marginLeft: 2 }}
              >
                Generate recipes
              </Button>

              <Modal
                open={openCamera}
                onClose={handleCloseCamera}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Component />
              </Modal>

              <Button
                variant="contained"
                onClick={handleOpenCamera}
                sx={{ marginLeft: 2 }}
              >
                Take picture
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      <Box border={"1px solid #333"} marginBottom={'20px'}>
        <Box
          width="800px"
          height="100px"
          bgcolor={"#ADD8E6"}
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Typography variant={"h2"} color={"#333"} textAlign={"center"}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="400px" overflow={"auto"}>
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              bgcolor={"#f0f0f0"}
              paddingX={5}
            >
              <Typography variant={"h5"} color={"#333"} textAlign={"center"}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>

              <Stack direction="row" paddingX={2} alignItems={"center"}>
                <Button onClick={() => decrease(name)}>
                  <Typography variant={"h4"} textAlign={"center"}>
                    -
                  </Typography>
                </Button>
                <Typography variant={"h5"} color={"#333"} textAlign={"center"}>
                  Quantity: {quantity}
                </Typography>
                <Button onClick={() => increase(name)}>
                  <Typography variant={"h4"} textAlign={"center"}>
                    +
                  </Typography>
                </Button>
              </Stack>

              <Modal
                open={openEdit}
                onClose={handleCloseEdit}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={style}>
                  <Typography
                    id="modal-modal-title"
                    variant="h6"
                    component="h2"
                  >
                    Edit Item
                  </Typography>
                  <Stack width="100%" direction={"row"} spacing={2}>
                    <TextField
                      id="outlined-basic"
                      label="Item"
                      variant="outlined"
                      fullWidth
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />

                    <TextField
                      id="outlined-basic"
                      label="Quantity"
                      variant="outlined"
                      fullWidth
                      value={Quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />

                    <Button
                      variant="outlined"
                      onClick={() => {
                        editItem(originalItemName, itemName, Number(Quantity));
                        setItemName("");
                        handleCloseEdit();
                      }}
                    >
                      Save
                    </Button>
                  </Stack>
                </Box>
              </Modal>
              <Button
                variant="contained"
                onClick={() => handleEdit(name, quantity)}
              >
                Edit
              </Button>

              <Button variant="contained" onClick={() => removeItem(name)}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
