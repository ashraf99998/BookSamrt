"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	Calendar,
	ChevronDown,
	DollarSign,
	Filter,
	PieChartIcon,
	TrendingUp,
} from "lucide-react";
import { CustomTooltip } from "./custom-toolltip";

interface SalesEntry {
	id: string;
	shiftDate: string;
	cash: number;
	coins: number;
	creditCards: number;
	ebt: number;
	insideSales: number;
	onlineLotto: number;
	instantLotto: number;
	outsideSales: number;
	payouts: number;
	expenses: number;
	tax1: number;
	tax2: number;
	z1Total: number;
	totalSales: number;
	difference: number;
	timestamp: any;
}

const groupByDate = (data: SalesEntry[]) => {
	return data.reduce((acc: Record<string, SalesEntry[]>, item) => {
		const key = item.shiftDate || "Unknown Date";
		if (!acc[key]) acc[key] = [];
		acc[key].push(item);
		return acc;
	}, {});
};

// Colors for charts
const COLORS = [
	"#10B981",
	"#3B82F6",
	"#F59E0B",
	"#EF4444",
	"#8B5CF6",
	"#EC4899",
];
const CHART_COLORS = {
	sales: "#10B981", // Green
	difference: "#3B82F6", // Blue
	z1Total: "#F59E0B", // Orange
};

const Summary: React.FC = () => {
	const [salesData, setSalesData] = useState<SalesEntry[]>([]);
	const [filteredData, setFilteredData] = useState<SalesEntry[]>([]);
	const [dateFilter, setDateFilter] = useState<string>("all");
	const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
		{}
	);
	const [activeTab, setActiveTab] = useState<string>("overview");

	useEffect(() => {
		const q = collection(db, "sales");
		const unsubscribe = onSnapshot(q, (snapshot) => {
			const data = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as SalesEntry[];

			// Sort by date (newest first)
			data.sort(
				(a, b) =>
					new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime()
			);

			setSalesData(data);
			setFilteredData(data);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (dateFilter === "all") {
			setFilteredData(salesData);
		} else if (dateFilter === "last7days") {
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			setFilteredData(
				salesData.filter((item) => new Date(item.shiftDate) >= sevenDaysAgo)
			);
		} else if (dateFilter === "last30days") {
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			setFilteredData(
				salesData.filter((item) => new Date(item.shiftDate) >= thirtyDaysAgo)
			);
		}
	}, [dateFilter, salesData]);

	const toggleCardExpansion = (id: string) => {
		setExpandedCards((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	// Calculate totals and averages
	const totalDifference = filteredData.reduce(
		(sum, item) => sum + (item.difference || 0),
		0
	);

	const totalSales = filteredData.reduce(
		(sum, item) => sum + (item.totalSales || 0),
		0
	);

	const averageDailyDifference = filteredData.length
		? totalDifference / filteredData.length
		: 0;

	const averageDailySales = filteredData.length
		? totalSales / filteredData.length
		: 0;

	// Prepare data for charts
	const dailySalesData = filteredData
		.slice(0, 14)
		.map((item) => ({
			date: item.shiftDate,
			sales: item.totalSales || 0,
			difference: item.difference || 0,
		}))
		.reverse();

	const paymentMethodData = filteredData.length
		? [
				{
					name: "Cash",
					value: filteredData.reduce((sum, item) => sum + (item.cash || 0), 0),
				},
				{
					name: "Credit Cards",
					value: filteredData.reduce(
						(sum, item) => sum + (item.creditCards || 0),
						0
					),
				},
				{
					name: "Coins",
					value: filteredData.reduce((sum, item) => sum + (item.coins || 0), 0),
				},
				{
					name: "EBT",
					value: filteredData.reduce((sum, item) => sum + (item.ebt || 0), 0),
				},
				{
					name: "Online Lotto",
					value: filteredData.reduce(
						(sum, item) => sum + (item.onlineLotto || 0),
						0
					),
				},
				{
					name: "Instant Lotto",
					value: filteredData.reduce(
						(sum, item) => sum + (item.instantLotto || 0),
						0
					),
				},
		  ]
		: [];

	const salesBreakdownData = filteredData.length
		? [
				{
					name: "Inside Sales",
					value: filteredData.reduce(
						(sum, item) => sum + (item.insideSales || 0),
						0
					),
				},
				{
					name: "Outside Sales",
					value: filteredData.reduce(
						(sum, item) => sum + (item.outsideSales || 0),
						0
					),
				},
				{
					name: "Payouts",
					value: filteredData.reduce(
						(sum, item) => sum + (item.payouts || 0),
						0
					),
				},
				{
					name: "Expenses",
					value: filteredData.reduce(
						(sum, item) => sum + (item.expenses || 0),
						0
					),
				},
				{
					name: "Tax 1",
					value: filteredData.reduce((sum, item) => sum + (item.tax1 || 0), 0),
				},
				{
					name: "Tax 2",
					value: filteredData.reduce((sum, item) => sum + (item.tax2 || 0), 0),
				},
		  ]
		: [];

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div className="flex items-center gap-3">
						<TrendingUp className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">
							Summary Dashboard
						</h1>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative">
							<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<select
								className="bg-gray-800 border border-gray-700 rounded-md pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
								value={dateFilter}
								onChange={(e) => setDateFilter(e.target.value)}
							>
								<option value="all">All Time</option>
								<option value="last7days">Last 7 Days</option>
								<option value="last30days">Last 30 Days</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex overflow-x-auto mb-6 border-b border-gray-800">
					<button
						className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
							activeTab === "overview"
								? "text-green-400 border-b-2 border-green-400"
								: "text-gray-400 hover:text-white"
						}`}
						onClick={() => setActiveTab("overview")}
					>
						Overview
					</button>
					<button
						className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
							activeTab === "charts"
								? "text-green-400 border-b-2 border-green-400"
								: "text-gray-400 hover:text-white"
						}`}
						onClick={() => setActiveTab("charts")}
					>
						Charts & Analytics
					</button>
					<button
						className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
							activeTab === "details"
								? "text-green-400 border-b-2 border-green-400"
								: "text-gray-400 hover:text-white"
						}`}
						onClick={() => setActiveTab("details")}
					>
						Detailed Reports
					</button>
				</div>

				{activeTab === "overview" && (
					<>
						{/* Stats Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
							<StatCard
								title="Total Sales"
								value={totalSales}
								icon={<DollarSign className="h-5 w-5 text-green-400" />}
								trend={totalSales > 0 ? "up" : "neutral"}
							/>
							<StatCard
								title="Total Difference"
								value={totalDifference}
								icon={<DollarSign className="h-5 w-5 text-green-400" />}
								trend={
									totalDifference > 0
										? "up"
										: totalDifference < 0
										? "down"
										: "neutral"
								}
							/>
							<StatCard
								title="Avg. Daily Sales"
								value={averageDailySales}
								icon={<DollarSign className="h-5 w-5 text-green-400" />}
								trend="neutral"
							/>
							<StatCard
								title="Avg. Daily Difference"
								value={averageDailyDifference}
								icon={<DollarSign className="h-5 w-5 text-green-400" />}
								trend={
									averageDailyDifference > 0
										? "up"
										: averageDailyDifference < 0
										? "down"
										: "neutral"
								}
							/>
						</div>

						{/* Recent Sales Chart */}
						<div className="bg-gray-800 rounded-lg p-4 mb-8">
							<h2 className="text-xl font-bold mb-4">Recent Sales Trend</h2>
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={dailySalesData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
										<XAxis
											dataKey="date"
											stroke="#9CA3AF"
											tick={{ fill: "#9CA3AF" }}
										/>
										<YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
										<Tooltip content={<CustomTooltip />} />
										<Legend />
										<Line
											type="monotone"
											dataKey="sales"
											name="Total Sales"
											stroke={CHART_COLORS.sales}
											strokeWidth={2}
											dot={{ r: 4 }}
											activeDot={{ r: 6 }}
										/>
										<Line
											type="monotone"
											dataKey="difference"
											name="Difference"
											stroke={CHART_COLORS.difference}
											strokeWidth={2}
											dot={{ r: 4 }}
											activeDot={{ r: 6 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>

						{/* Recent Entries */}
						<div className="bg-gray-800 rounded-lg p-4 mb-8">
							<h2 className="text-xl font-bold mb-4">Recent Entries</h2>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-700">
											<th className="text-left py-3 px-4">Date</th>
											<th className="text-right py-3 px-4">Inside Sales</th>
											<th className="text-right py-3 px-4">Total Sales</th>
											<th className="text-right py-3 px-4">Z1 Total</th>
											<th className="text-right py-3 px-4">Difference</th>
										</tr>
									</thead>
									<tbody>
										{filteredData.slice(0, 5).map((entry) => (
											<tr
												key={entry.id}
												className="border-b border-gray-700 hover:bg-gray-700"
											>
												<td className="py-3 px-4">{entry.shiftDate}</td>
												<td className="text-right py-3 px-4">
													${(entry.insideSales || 0).toFixed(2)}
												</td>
												<td className="text-right py-3 px-4">
													${(entry.totalSales || 0).toFixed(2)}
												</td>
												<td className="text-right py-3 px-4">
													${(entry.z1Total || 0).toFixed(2)}
												</td>
												<td
													className={`text-right py-3 px-4 ${
														(entry.difference || 0) >= 0
															? "text-green-400"
															: "text-red-400"
													}`}
												>
													${(entry.difference || 0).toFixed(2)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</>
				)}

				{activeTab === "charts" && (
					<>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
							{/* Payment Methods Pie Chart */}
							<div className="bg-gray-800 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-4">
									<PieChartIcon className="h-5 w-5 text-green-400" />
									<h2 className="text-xl font-bold">Payment Methods</h2>
								</div>
								<div className="h-80">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={paymentMethodData}
												cx="50%"
												cy="50%"
												labelLine={false}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
												label={({ name, percent }) =>
													`${name}: ${(percent * 100).toFixed(0)}%`
												}
											>
												{paymentMethodData.map((_entry, index) => (
													<Cell
														key={`cell-${index}`}
														fill={COLORS[index % COLORS.length]}
													/>
												))}
											</Pie>
											<Tooltip content={<CustomTooltip />} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							</div>

							{/* Sales Breakdown Pie Chart */}
							<div className="bg-gray-800 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-4">
									<PieChartIcon className="h-5 w-5 text-green-400" />
									<h2 className="text-xl font-bold">Sales Breakdown</h2>
								</div>
								<div className="h-80">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={salesBreakdownData}
												cx="50%"
												cy="50%"
												labelLine={false}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
												label={({ name, percent }) =>
													`${name}: ${(percent * 100).toFixed(0)}%`
												}
											>
												{salesBreakdownData.map((_entry, index) => (
													<Cell
														key={`cell-${index}`}
														fill={COLORS[index % COLORS.length]}
													/>
												))}
											</Pie>
											<Tooltip content={<CustomTooltip />} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>

						{/* Daily Comparison Bar Chart */}
						<div className="bg-gray-800 rounded-lg p-4 mb-8">
							<h2 className="text-xl font-bold mb-4">Daily Comparison</h2>
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={dailySalesData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
										<XAxis
											dataKey="date"
											stroke="#9CA3AF"
											tick={{ fill: "#9CA3AF" }}
										/>
										<YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
										<Tooltip content={<CustomTooltip />} />
										<Legend />
										<Bar
											dataKey="sales"
											name="Total Sales"
											fill={CHART_COLORS.sales}
										/>
										<Bar
											dataKey="difference"
											name="Difference"
											fill={CHART_COLORS.difference}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</>
				)}

				{activeTab === "details" && (
					<>
						{/* Detailed Reports by Date */}
						{Object.entries(groupByDate(filteredData)).map(
							([date, entries]) => (
								<div key={date} className="mb-8">
									<div className="flex items-center gap-2 mb-4">
										<Calendar className="h-5 w-5 text-green-400" />
										<h2 className="text-xl font-bold">{date}</h2>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										{entries.map((entry) => (
											<div
												key={entry.id}
												className="bg-gray-800 rounded-lg shadow overflow-hidden"
											>
												<div
													className="p-4 cursor-pointer hover:bg-gray-700 transition-colors"
													onClick={() => toggleCardExpansion(entry.id)}
												>
													<div className="flex justify-between items-center">
														<h3 className="font-semibold">Shift Report</h3>
														<ChevronDown
															className={`h-5 w-5 transition-transform ${
																expandedCards[entry.id] ? "rotate-180" : ""
															}`}
														/>
													</div>
													<div className="grid grid-cols-2 gap-2 mt-2">
														<div>
															<p className="text-gray-400 text-sm">
																Inside Sales
															</p>
															<p className="font-medium">
																${(entry.insideSales || 0).toFixed(2)}
															</p>
														</div>
														<div>
															<p className="text-gray-400 text-sm">
																Total Sales
															</p>
															<p className="font-medium">
																${(entry.totalSales || 0).toFixed(2)}
															</p>
														</div>
														<div>
															<p className="text-gray-400 text-sm">Z1 Total</p>
															<p className="font-medium">
																${(entry.z1Total || 0).toFixed(2)}
															</p>
														</div>
														<div>
															<p className="text-gray-400 text-sm">
																Difference
															</p>
															<p
																className={`font-medium ${
																	(entry.difference || 0) >= 0
																		? "text-green-400"
																		: "text-red-400"
																}`}
															>
																${(entry.difference || 0).toFixed(2)}
															</p>
														</div>
													</div>
												</div>

												{expandedCards[entry.id] && (
													<div className="p-4 border-t border-gray-700 bg-gray-750">
														<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
															<DetailItem label="Cash" value={entry.cash} />
															<DetailItem label="Coins" value={entry.coins} />
															<DetailItem
																label="Credit Cards"
																value={entry.creditCards}
															/>
															<DetailItem label="EBT" value={entry.ebt} />
															<DetailItem
																label="Online Lotto"
																value={entry.onlineLotto}
															/>
															<DetailItem
																label="Instant Lotto"
																value={entry.instantLotto}
															/>
															<DetailItem
																label="Outside Sales"
																value={entry.outsideSales}
															/>
															<DetailItem
																label="Payouts"
																value={entry.payouts}
															/>
															<DetailItem
																label="Expenses"
																value={entry.expenses}
															/>
															<DetailItem label="Tax 1" value={entry.tax1} />
															<DetailItem label="Tax 2" value={entry.tax2} />
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							)
						)}
					</>
				)}
			</div>
		</div>
	);
};

interface StatCardProps {
	title: string;
	value: number;
	icon: React.ReactNode;
	trend: "up" | "down" | "neutral";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
	return (
		<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
			<div className="flex justify-between items-start">
				<div>
					<p className="text-gray-400 text-sm">{title}</p>
					<p className="text-2xl font-bold mt-1">${value.toFixed(2)}</p>
				</div>
				<div className="p-2 bg-gray-700 rounded-full">{icon}</div>
			</div>
			<div className="mt-2">
				<span
					className={`text-sm ${
						trend === "up"
							? "text-green-400"
							: trend === "down"
							? "text-red-400"
							: "text-gray-400"
					}`}
				>
					{trend === "up" && "↑ "}
					{trend === "down" && "↓ "}
					{trend === "neutral" && ""}
					{trend === "up"
						? "Positive"
						: trend === "down"
						? "Negative"
						: "Neutral"}
				</span>
			</div>
		</div>
	);
};

interface DetailItemProps {
	label: string;
	value: number;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
	return (
		<div>
			<p className="text-gray-400 text-xs">{label}</p>
			<p className="font-medium">${(value || 0).toFixed(2)}</p>
		</div>
	);
};

export default Summary;
