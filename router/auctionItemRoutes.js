import { addNewAuctionItem, getAllitems, getAuctionDetails,getMyAuctionItems, removeFromAuction, republishItems } from "../controllers/auctionItemController.js";
import {isAuthenticated, isAuthorized} from "../middlewares/auth.js"
import express from "express";
import { trackCommissionStatus } from "../middlewares/trackCommissionStatus.js";
const router =express.Router();

router.post("/create", isAuthenticated, isAuthorized("Auctioneer"),trackCommissionStatus, addNewAuctionItem);
router.get("/allitems", getAllitems);
router.get("/auction/:id", isAuthenticated,getAuctionDetails);
router.get("/myitems",isAuthenticated,isAuthorized("Auctioneer"),getMyAuctionItems);
router.delete("/delete/:id",isAuthenticated,isAuthorized("Auctioneer"),removeFromAuction);
router.put("/item/republish/:id",isAuthenticated,isAuthorized("Auctioneer"),republishItems);

export default router;
