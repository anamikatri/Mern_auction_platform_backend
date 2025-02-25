import cron from "node-cron";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { Bid } from "../models/bidSchema.js";
import { sendEmail } from "../utils/sendEmail.js";
import { calculatedCommission } from "../controllers/commissionController.js";
export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log("Cron for ended auction running......");
    try {
      const auctions = await Auction.find({
        commissionCalculated: false,
      });
      // auctions array
      console.log("auctions array",auctions);
      const now = new Date();
      const endedAuctions = auctions.filter(auction => {
        // Convert the auction's endTime string to a Date object
        const auctionEndDate = new Date(auction.endTime);
        return auctionEndDate < now;
      });
      endedAuctions.forEach(auction => {
        console.log(`Auction ID: ${auction._id}, End Time: ${auction.endTime}, Current Time: ${now}`);
          });
      console.log("endedAuctions length:", endedAuctions.length);
      for (const auction of endedAuctions) {
        try {
          console.log("Auction ID:", auction._id, typeof auction._id);
          console.log("Auction Current Bid:", auction.currentBid, typeof auction.currentBid);
          const commissionAmount = await calculatedCommission(auction._id);
          auction.commissionCalculated = true;
          const highestBidder = await Bid.findOne({
            auctionItem: auction._id,
            amount: auction.currentBid,
          });
          console.log(highestBidder);
          const auctioneer = await User.findById(auction.createdBy);
          if (!auctioneer) {
            console.error(`Auctioneer not found for auction ${auction._id}`);
            continue;
          }
          if (highestBidder) {
            auction.highestBidder = highestBidder;
            await auction.save();
            const bidder = await User.findById(highestBidder.bidder.id);
            if (!bidder) {
              console.error(`Bidder not found: ${highestBidder.bidder.id}`);
              continue;
            }
            await User.findByIdAndUpdate(
              bidder._id,
              {
                $inc: {
                  moneySpent: highestBidder.amount,
                  auctionsWon: 1,
                },
              },
              { new: true }
            );
            await User.findByIdAndUpdate(
              auctioneer._id,
              {
                $inc: {
                  unpaidCommission: Math.ceil(commissionAmount),
                },
              },
              { new: true }
            );
            const subject = `🎉 Congratulations! You Won an Auction on Deepak Auction 🎉`;
            const message = `
              <p>Dear ${User.userName},</p>
            
              <p>We are thrilled to inform you that you have <b>successfully won</b> an auction on our platform! 
              Your bid was the highest, and the item is now yours.</p>
            
              <h3>Auction Details:</h3>
              <ul>
                <li><b>Item Name:</b> ${auction.title}</li>
                <li><b>Winning Bid:</b> ${highestBidder.amount}</li>
                <li><b>Auction End Date:</b> ${auction.endTime}</li>
              </ul>
            
              <p>To proceed with the payment and item collection, please contact the auctioneer at:</p>
              <ul>
                <li><b>Email:</b> ${auctioneer.email}</li>
                <li><b>Unpaid Commission:</b> ${Math.ceil((highestBidder.amount)*.05)}</li>
                <li>After paying Unpaid Commission You will get Approved mail..</li>
              </ul>
            
              <p>Once payment is confirmed, the item will be shipped to you accordingly.</p>
            
              <p>Thank you for participating, and we hope to see you in more auctions soon!</p>
            
              <p>Best regards,</p>
              <p><b>Anamika Auction Team</b></p>
            `;
            try {
              await sendEmail({ email: bidder.email, subject, message });
              console.log("SUCCESSFULLY SENT EMAIL TO HIGHEST BIDDER");
            } catch (emailError) {
              console.error("Failed to send email:", emailError);
            }
          } else {
            await auction.save();
          }
        } catch (error) {
          console.error("Error processing auction:", auction._id, error);
        }
      }
    } catch (error) {
      console.error("Error running endedAuctionCron:", error);
    }
  });
};



