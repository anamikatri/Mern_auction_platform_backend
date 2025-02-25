import  mongoose  from "mongoose";
import {catchAsyncErrors} from "../middlewares/catchAsyncError.js";
import ErrorHandler from  "../middlewares/error.js";
import {Commission} from "../models/commissionSchema.js";
import {User} from "../models/userSchema.js";
import {Auction} from "../models/auctionSchema.js";
import {PaymentProof} from "../models/commissionProofSchema.js"

export const deleteAuctionItem = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
  
      return next(new ErrorHandler("Invalid Id format.", 400));
    }
    const auctionItem = await Auction.findById(id);
    if (!auctionItem) {
      return next(new ErrorHandler("Auction not found.", 404));
    }
    await auctionItem.deleteOne();
    res.status(200).json({
      success: true,
      message: "Auction items deleted successfully.",
    })
  })
export const getAllPaymentProofs=catchAsyncErrors(async(req,res,next)=>{
    let PaymentProofs=await PaymentProof.find();
    res.status(200).json({
        success:true,
        PaymentProofs
    })
    
});

export const getAllPaymentProofDetail=catchAsyncErrors(async(req,res,next)=>{
     const {id}=req.params;
     console.log(`params ${req.params}`);
     const paymentProofDetail=await PaymentProof.findById(id);
     res.status(200).json({
        success:true,
        paymentProofDetail
     })
});

export const updateProofStatus=catchAsyncErrors(async(req,res,next)=>{
    const {id}=req.params;
    console.log(`body: ${req.body}`);
    const {amount,status} =req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return next(new ErrorHandler("Invalid id format",400));
    }
    let proof=await PaymentProof.findById(id);
    if(!proof){
        return next(new ErrorHandler("Payment proof not found",404));
    }
    proof=await PaymentProof.findByIdAndUpdate(id,{status,amount},{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    res.status(200).json({
        success:true,
        message:"Payment proof amount and status updated",
        proof,
    })
    
});

export const deletePaymentProof=catchAsyncErrors(async(req,res,next)=>{
    const {id}=req.params;
    const proof=await PaymentProof.findById(id);
    if(!proof){
        return next(new ErrorHandler("payment proof not found",404));
    }
    await proof.deleteOne();
    res.status(200).json({
        success:true,
        message:"Payment proof deleted"
    });
});

export const fetchAllUsers=catchAsyncErrors(async(req,res,next)=>{
    const users=await User.aggregate([
        {
            $group:{
                _id:{
                    month:{$month:"$createdAt"},
                    year:{$month:"$createdAt"},
                    role:"$role"
                },
                count:{$sum:1},
            },
        
        },
        {
            $project:{
                month:"$_id.month",year:"$_id.year",role:"$_id.role",count:1,_id:0
            }
        },
        {
            $sort:{year:1,month:1},
        },
    ]);
    const bidders=users.filter((user)=>user.role==='Bidder');
    const auctioneers=users.filter((user)=>user.role==='Auctioneer');
    const tranformDataToMonthlyArray = (data, totalMonths = 12) => {
        const result = Array(totalMonths).fill(0);
    
        data.forEach((item) => {
          result[item.month - 1] = item.count;
        });
    
        return result;
      };
    
      const biddersArray = tranformDataToMonthlyArray(bidders);
      const auctioneersArray = tranformDataToMonthlyArray(auctioneers);
    
      res.status(200).json({
        success: true,
        biddersArray,
        auctioneersArray,
      });
    });

export const monthlyRevenue = catchAsyncErrors(async (req, res, next) => {
    const payments = await Commission.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
  
    const tranformDataToMonthlyArray = (payments, totalMonths = 12) => {
      const result = Array(totalMonths).fill(0);
  
      payments.forEach((payment) => {
        result[payment._id.month - 1] = payment.totalAmount;
      });
  
      return result;
    };
  
    const totalMonthlyRevenue = tranformDataToMonthlyArray(payments);
    res.status(200).json({
      success: true,
      totalMonthlyRevenue,
    });
  });