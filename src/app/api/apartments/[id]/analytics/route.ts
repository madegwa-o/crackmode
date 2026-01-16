
// ✅ /api/apartments/[id]/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { House } from "@/models/House";
import { Apartment } from "@/models/Apartment";
import { Types } from "mongoose";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {


		const { id } = await params;

		// Get apartment rent amount
		const apartment = await Apartment.findById(id).select('rentAmount numberOfDoors').lean();
		if (!apartment) {
			return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
		}

		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();

		// Efficient analytics aggregation
		const [analytics] = await House.aggregate([
			{ $match: { apartment: new Types.ObjectId(id) } },
			{
				$group: {
					_id: null,
					totalUnits: { $sum: 1 },
					occupiedCount: {
						$sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] }
					},
					vacantCount: {
						$sum: { $cond: [{ $eq: ["$status", "vacant"] }, 1, 0] }
					},
					currentMonthIncome: {
						$sum: {
							$cond: [
								{
									$anyElementTrue: {
										$map: {
											input: "$rentPaid",
											as: "payment",
											in: {
												$and: [
													{ $eq: ["$$payment.month", currentMonth] },
													{ $eq: ["$$payment.year", currentYear] },
													{ $eq: ["$$payment.status", "paid"] }
												]
											}
										}
									}
								},
								apartment.rentAmount,
								0
							]
						}
					}
				}
			}
		]);

		const occupancyRate = analytics.totalUnits > 0 ? (analytics.occupiedCount / analytics.totalUnits) * 100 : 0;
		const potentialIncome = analytics.occupiedCount * apartment.rentAmount;
		const rentCollectionRate = potentialIncome > 0 ? (analytics.currentMonthIncome / potentialIncome) * 100 : 0;

		return NextResponse.json({
			occupiedCount: analytics.occupiedCount || 0,
			vacantCount: analytics.vacantCount || 0,
			occupancyRate: Math.round(occupancyRate * 10) / 10,
			currentMonthIncome: analytics.currentMonthIncome || 0,
			potentialIncome,
			rentCollectionRate: Math.round(rentCollectionRate * 10) / 10
		});

	} catch (error) {
		console.error("Error fetching analytics:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
