import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import CartItems from "@/models/addCart";
import Items from "@/models/additems";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch populated cart items for the logged-in user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        await connectDB();

        const cart = await CartItems.findOne({ userId });
        if (!cart || !cart.items || cart.items.length === 0) {
            return NextResponse.json({ items: [] }, { status: 200 });
        }

        // Fetch all product details for itemIds in cart in parallel
        const itemIds = cart.items.map((item) => item.itemId);
        const products = await Items.find({ _id: { $in: itemIds } });
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        const populatedItems = cart.items.map((item) => {
            const product = productMap.get(item.itemId);
            return {
                itemId: item.itemId,
                quantity: item.quantity,
                price: item.price,
                name: product?.name || "Unknown Product",
                description: product?.description || "",
                imageUrl: product?.imageUrl || [],
            };
        });

        return NextResponse.json({ items: populatedItems }, { status: 200 });
    } catch (error) {
        console.error("GET cart error:", error);
        return NextResponse.json({ message: "Failed to fetch cart items" }, { status: 500 });
    }
}

// POST: Add an item to the cart or increment its quantity
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { itemId, quantity, price } = await req.json();

        if (!itemId || !quantity || !price) {
            return NextResponse.json({ message: "Missing item attributes" }, { status: 400 });
        }

        await connectDB();

        let cart = await CartItems.findOne({ userId });

        if (!cart) {
            cart = new CartItems({
                userId,
                items: [{ itemId, quantity, price }],
            });
        } else {
            const itemIndex = cart.items.findIndex((item) => item.itemId === itemId);
            if (itemIndex > -1) {
                // Increment quantity
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Add new item
                cart.items.push({ itemId, quantity, price });
            }
        }

        await cart.save();
        return NextResponse.json({ message: "Item added to cart", itemsCount: cart.items.length }, { status: 200 });
    } catch (error) {
        console.error("POST cart error:", error);
        return NextResponse.json({ message: "Failed to add item to cart" }, { status: 500 });
    }
}

// PUT: Direct modification of item quantity (sets absolute quantity, deletes if <= 0)
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { itemId, quantity } = await req.json();

        if (!itemId || quantity === undefined) {
            return NextResponse.json({ message: "Missing required parameters" }, { status: 400 });
        }

        await connectDB();

        const cart = await CartItems.findOne({ userId });
        if (!cart) {
            return NextResponse.json({ message: "Cart not found" }, { status: 404 });
        }

        const itemIndex = cart.items.findIndex((item) => item.itemId === itemId);
        if (itemIndex > -1) {
            if (quantity <= 0) {
                // Remove item from cart
                cart.items.splice(itemIndex, 1);
            } else {
                // Set absolute quantity
                cart.items[itemIndex].quantity = quantity;
            }
            await cart.save();
            return NextResponse.json({ message: "Cart updated successfully", itemsCount: cart.items.length }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Item not found in cart" }, { status: 404 });
        }
    } catch (error) {
        console.error("PUT cart error:", error);
        return NextResponse.json({ message: "Failed to update cart item" }, { status: 500 });
    }
}

// DELETE: Remove item from cart or clear entire cart
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { itemId, clearAll } = await req.json();

        await connectDB();

        if (clearAll) {
            await CartItems.deleteOne({ userId });
            return NextResponse.json({ message: "Cart cleared successfully" }, { status: 200 });
        }

        if (!itemId) {
            return NextResponse.json({ message: "Missing item ID" }, { status: 400 });
        }

        const cart = await CartItems.findOne({ userId });
        if (!cart) {
            return NextResponse.json({ message: "Cart not found" }, { status: 404 });
        }

        cart.items = cart.items.filter((item) => item.itemId !== itemId);
        await cart.save();

        return NextResponse.json({ message: "Item removed from cart", itemsCount: cart.items.length }, { status: 200 });
    } catch (error) {
        console.error("DELETE cart error:", error);
        return NextResponse.json({ message: "Failed to remove item from cart" }, { status: 500 });
    }
}
