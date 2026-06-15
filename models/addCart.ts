import mongoose, { Schema, Document, Model } from "mongoose";

export interface cartItems extends Document {

    userId: string;
    items: Array<{
        itemId: string;
        quantity: number;
        price: number;
    }>;

}


const cartItemsShema = new Schema<cartItems>(
    {
        userId: {
            type: String,
            required: true,
        },
        items: [
            {
                itemId: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true
    }
);

const CartItems: Model<cartItems> = mongoose.models.CartItems || mongoose.model<cartItems>("CartItems", cartItemsShema);
export default CartItems;