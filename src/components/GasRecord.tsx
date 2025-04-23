"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
	addDoc,
	collection,
	Timestamp,
	getDocs,
	query,
	where,
	orderBy,
	limit,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";
import {
	Calendar,
	Droplet,
	Save,
	TrendingUp,
	Filter,
	RefreshCw,
	AlertCircle,
	CheckCircle2,
	Loader2,
	BarChart2,
	ArrowDown,
	ArrowUp,
} from "lucide-react";

interface GasRecord {
	id?: string;
	date: string;
	regular: number;
	mid: number;
	premium: number;
	timestamp?: Timestamp;
}

interface DateRange {
	label: string;
	days: number;
}

const GasRecord: React.FC = () => {
	// Form state
	const [date, setDate] = useState(
		() => new Date().toISOString().split("T")[0]
	);
	const [regular, setRegular] = useState<number | "">("");
	const [mid, setMid] = useState<number | "">("");
	const [premium, setPremium] = useState<number | "">("");

	// UI state
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [notification, setNotification] = useState<{
		show: boolean;
		message: string;
		type: "success" | "error";
	}>({ show: false, message: "", type: "success" });
	const [chartType, setChartType] = useState<"line" | "bar">("line");

	// Data state
	const [recentRecords, setRecentRecords] = useState<GasRecord[]>([]);
	const [chartData, setChartData] = useState<GasRecord[]>([]);
	const [selectedRange, setSelectedRange] = useState<DateRange>({
		label: "Last 30 Days",
		days: 30,
	});
	const [customStartDate, setCustomStartDate] = useState<string>("");
	const [customEndDate, setCustomEndDate] = useState<string>("");
	const [showCustomRange, setShowCustomRange] = useState(false);

	const dateRanges: DateRange[] = [
		{ label: "Last 7 Days", days: 7 },
		{ label: "Last 30 Days", days: 30 },
		{ label: "Last 90 Days", days: 90 },
		{ label: "Last 180 Days", days: 180 },
		{ label: "Custom Range", days: 0 },
	];

	const fetchRecent = async () => {
		try {
			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
			const dateStr = threeDaysAgo.toISOString().split("T")[0];

			const q = query(
				collection(db, "gasRecords"),
				where("date", ">=", dateStr),
				orderBy("date", "desc"),
				limit(7)
			);

			const snapshot = await getDocs(q);
			const records = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as GasRecord[];

			// Fill in missing dates for the last 3 days
			const dates = [0, 1, 2, 3].map((offset) => {
				const d = new Date();
				d.setDate(d.getDate() - offset);
				return d.toISOString().split("T")[0];
			});

			const fullRecords = dates.map((date) => {
				const existing = records.find((r) => r.date === date);
				return {
					date,
					regular: existing?.regular ?? "",
					mid: existing?.mid ?? "",
					premium: existing?.premium ?? "",
				};
			});

			setRecentRecords(fullRecords.reverse());
		} catch (error) {
			console.error("Error fetching recent records:", error);
			showNotification("Failed to load recent records", "error");
		}
	};

	const fetchChartData = async (days: number, start?: string, end?: string) => {
		try {
			setLoading(true);
			let startDate: Date;
			let endDate = new Date();

			if (start && end) {
				// Custom date range
				startDate = new Date(start);
				endDate = new Date(end);
			} else {
				// Predefined range
				startDate = new Date();
				startDate.setDate(startDate.getDate() - days);
			}

			const startDateStr = startDate.toLocaleDateString("sv-SE");
			const endDateStr = endDate.toLocaleDateString("sv-SE");

			const q = query(
				collection(db, "gasRecords"),
				where("date", ">=", startDateStr),
				where("date", "<=", endDateStr),
				orderBy("date", "asc")
			);

			const snapshot = await getDocs(q);
			const records = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as GasRecord[];

			setChartData(records);
		} catch (error) {
			console.error("Error fetching chart data:", error);
			showNotification("Failed to load chart data", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRecent();
		fetchChartData(selectedRange.days);
	}, []);

	useEffect(() => {
		if (
			selectedRange.label === "Custom Range" &&
			customStartDate &&
			customEndDate
		) {
			fetchChartData(0, customStartDate, customEndDate);
		} else if (selectedRange.label !== "Custom Range") {
			fetchChartData(selectedRange.days);
		}
	}, [selectedRange, customStartDate, customEndDate]);

	const handleSave = async () => {
		// Validate inputs
		if (regular === "" || mid === "" || premium === "") {
			showNotification("Please fill in all tank level fields", "error");
			return;
		}

		try {
			setSaving(true);
			// Use the date exactly as selected in the input
			const localDateStr = date;

			await addDoc(collection(db, "gasRecords"), {
				date: localDateStr,
				regular: Number(regular),
				mid: Number(mid),
				premium: Number(premium),
				timestamp: Timestamp.now(),
			});

			showNotification("Gas inventory record saved successfully!", "success");

			// Reset form
			setRegular("");
			setMid("");
			setPremium("");
			setDate(new Date().toISOString().split("T")[0]);

			// Refresh data
			fetchRecent();
			fetchChartData(selectedRange.days);
		} catch (error) {
			console.error("Error saving gas record:", error);
			showNotification("Failed to save record", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleRangeChange = (range: DateRange) => {
		setSelectedRange(range);
		if (range.label === "Custom Range") {
			setShowCustomRange(true);
		} else {
			setShowCustomRange(false);
		}
	};

	const handleCustomRangeApply = () => {
		if (!customStartDate || !customEndDate) {
			showNotification("Please select both start and end dates", "error");
			return;
		}

		if (new Date(customStartDate) > new Date(customEndDate)) {
			showNotification("Start date cannot be after end date", "error");
			return;
		}

		fetchChartData(0, customStartDate, customEndDate);
	};

	const showNotification = (message: string, type: "success" | "error") => {
		setNotification({ show: true, message, type });
		setTimeout(() => {
			setNotification({ show: false, message: "", type: "success" });
		}, 3000);
	};

	const formatDate = (dateString: string) => {
		const [year, month, day] = dateString.split("-");
		const date = new Date(Number(year), Number(month) - 1, Number(day));
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	};

	const getLevelTrend = (current: number, previous: number | "") => {
		if (previous === "" || current === previous) return null;
		return current > previous ? (
			<ArrowUp className="h-4 w-4 text-green-400" />
		) : (
			<ArrowDown className="h-4 w-4 text-red-400" />
		);
	};

	const calculateStats = () => {
		if (chartData.length === 0)
			return {
				avg: { regular: 0, mid: 0, premium: 0 },
				min: { regular: 0, mid: 0, premium: 0 },
				max: { regular: 0, mid: 0, premium: 0 },
				total: { regular: 0, mid: 0, premium: 0 },
			};

		const stats = chartData.reduce(
			(acc, record) => {
				// Update min values
				if (record.regular < acc.min.regular || acc.min.regular === 0)
					acc.min.regular = record.regular;
				if (record.mid < acc.min.mid || acc.min.mid === 0)
					acc.min.mid = record.mid;
				if (record.premium < acc.min.premium || acc.min.premium === 0)
					acc.min.premium = record.premium;

				// Update max values
				if (record.regular > acc.max.regular) acc.max.regular = record.regular;
				if (record.mid > acc.max.mid) acc.max.mid = record.mid;
				if (record.premium > acc.max.premium) acc.max.premium = record.premium;

				// Sum for average calculation
				acc.sum.regular += record.regular;
				acc.sum.mid += record.mid;
				acc.sum.premium += record.premium;

				return acc;
			},
			{
				min: { regular: 0, mid: 0, premium: 0 },
				max: { regular: 0, mid: 0, premium: 0 },
				sum: { regular: 0, mid: 0, premium: 0 },
			}
		);

		const count = chartData.length;

		// Get the most recent record for current levels
		const latest =
			chartData.length > 0
				? chartData[chartData.length - 1]
				: { regular: 0, mid: 0, premium: 0 };

		return {
			avg: {
				regular: Number.parseFloat((stats.sum.regular / count).toFixed(2)),
				mid: Number.parseFloat((stats.sum.mid / count).toFixed(2)),
				premium: Number.parseFloat((stats.sum.premium / count).toFixed(2)),
			},
			min: stats.min,
			max: stats.max,
			total: {
				regular: latest.regular,
				mid: latest.mid,
				premium: latest.premium,
			},
		};
	};

	const stats = calculateStats();

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
			{notification.show && (
				<div
					className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
						notification.type === "success" ? "bg-green-600" : "bg-red-600"
					}`}
				>
					{notification.type === "success" ? (
						<CheckCircle2 className="h-5 w-5" />
					) : (
						<AlertCircle className="h-5 w-5" />
					)}
					{notification.message}
				</div>
			)}

			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
					<div className="flex items-center gap-3">
						<Droplet className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">
							Gas Tank Inventory
						</h1>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Recent Records */}
					<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
						<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<Calendar className="h-5 w-5 text-green-400" />
							Recent Measurements
						</h2>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-gray-400 border-b border-gray-700">
										<th className="py-2 px-3">Type</th>
										{recentRecords.map((r, i) => (
											<th key={i} className="py-2 px-3">
												{formatDate(r.date)}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{(["regular", "mid", "premium"] as const).map((type) => (
										<tr
											key={type}
											className="border-b border-gray-700 hover:bg-gray-750"
										>
											<td className="py-2 px-3 capitalize">{type}</td>
											{recentRecords.map((r, idx) => (
												<td key={idx} className="py-2 px-3 text-center">
													{r[type] === "" ? "-" : r[type]}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="mt-4">
							<button
								onClick={() => fetchRecent()}
								className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
							>
								<RefreshCw className="h-3 w-3" />
								Refresh Data
							</button>
						</div>
					</div>

					{/* Add New Record */}
					<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
						<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<Droplet className="h-5 w-5 text-green-400" />
							Add New Measurement
						</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">
									Date
								</label>
								<div className="relative">
									<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										type="date"
										className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
										value={date}
										onChange={(e) => setDate(e.target.value)}
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">
									Regular Gas
								</label>
								<input
									type="number"
									step="0.1"
									min="0"
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									value={regular}
									onChange={(e) =>
										setRegular(e.target.value ? Number(e.target.value) : "")
									}
									placeholder="0.0"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">
									Mid-Grade Gas
								</label>
								<input
									type="number"
									step="0.1"
									min="0"
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									value={mid}
									onChange={(e) =>
										setMid(e.target.value ? Number(e.target.value) : "")
									}
									placeholder="0.0"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">
									Premium Gas
								</label>
								<input
									type="number"
									step="0.1"
									min="0"
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									value={premium}
									onChange={(e) =>
										setPremium(e.target.value ? Number(e.target.value) : "")
									}
									placeholder="0.0"
								/>
							</div>
							<button
								onClick={handleSave}
								disabled={saving}
								className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{saving ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										<span>Saving...</span>
									</>
								) : (
									<>
										<Save className="h-4 w-4" />
										<span>Save Measurement</span>
									</>
								)}
							</button>
						</div>
					</div>

					{/* Inventory Statistics */}
					<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
						<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-green-400" />
							Inventory Statistics
						</h2>
						<div className="space-y-4">
							<div className="bg-gray-750 p-3 rounded-lg">
								<h3 className="text-sm font-medium text-gray-400 mb-2">
									Current Inventory Levels
								</h3>
								<div className="grid grid-cols-3 gap-2">
									<div>
										<p className="text-xs text-gray-500">Regular</p>
										<p className="text-lg font-semibold">
											{stats.total.regular}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-500">Mid-Grade</p>
										<p className="text-lg font-semibold">{stats.total.mid}</p>
									</div>
									<div>
										<p className="text-xs text-gray-500">Premium</p>
										<p className="text-lg font-semibold">
											{stats.total.premium}
										</p>
									</div>
								</div>
							</div>

							<div className="bg-gray-750 p-3 rounded-lg">
								<h3 className="text-sm font-medium text-gray-400 mb-2">
									Average Levels
								</h3>
								<div className="grid grid-cols-3 gap-2">
									<div>
										<p className="text-xs text-gray-500">Regular</p>
										<p className="text-lg font-semibold">{stats.avg.regular}</p>
									</div>
									<div>
										<p className="text-xs text-gray-500">Mid-Grade</p>
										<p className="text-lg font-semibold">{stats.avg.mid}</p>
									</div>
									<div>
										<p className="text-xs text-gray-500">Premium</p>
										<p className="text-lg font-semibold">{stats.avg.premium}</p>
									</div>
								</div>
							</div>

							<div className="bg-gray-750 p-3 rounded-lg">
								<h3 className="text-sm font-medium text-gray-400 mb-2">
									Lowest Recorded Levels
								</h3>
								<div className="grid grid-cols-3 gap-2">
									<div>
										<p className="text-xs text-gray-500">Regular</p>
										<p className="text-lg font-semibold text-red-400">
											{stats.min.regular}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-500">Mid-Grade</p>
										<p className="text-lg font-semibold text-red-400">
											{stats.min.mid}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-500">Premium</p>
										<p className="text-lg font-semibold text-red-400">
											{stats.min.premium}
										</p>
									</div>
								</div>
							</div>

							<div className="text-xs text-gray-500 text-center">
								Based on {chartData.length} records from {selectedRange.label}
							</div>
						</div>
					</div>
				</div>

				{/* Gas Level Chart */}
				<div className="bg-gray-800 rounded-lg p-4 shadow-lg mt-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
						<div className="flex items-center gap-4">
							<h2 className="text-xl font-semibold flex items-center gap-2">
								<TrendingUp className="h-5 w-5 text-green-400" />
								Gas Inventory Trends
							</h2>

							<div className="flex items-center gap-2">
								<button
									onClick={() => setChartType("line")}
									className={`p-1 rounded ${
										chartType === "line"
											? "bg-green-600 text-white"
											: "bg-gray-700 text-gray-400"
									}`}
									title="Line Chart"
								>
									<TrendingUp className="h-4 w-4" />
								</button>
								<button
									onClick={() => setChartType("bar")}
									className={`p-1 rounded ${
										chartType === "bar"
											? "bg-green-600 text-white"
											: "bg-gray-700 text-gray-400"
									}`}
									title="Bar Chart"
								>
									<BarChart2 className="h-4 w-4" />
								</button>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<div className="relative">
								<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<select
									value={selectedRange.label}
									onChange={(e) => {
										const selected = dateRanges.find(
											(range) => range.label === e.target.value
										);
										if (selected) handleRangeChange(selected);
									}}
									className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									{dateRanges.map((range) => (
										<option key={range.label} value={range.label}>
											{range.label}
										</option>
									))}
								</select>
							</div>

							{showCustomRange && (
								<div className="flex flex-wrap gap-2">
									<input
										type="date"
										value={customStartDate}
										onChange={(e) => setCustomStartDate(e.target.value)}
										className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
									<input
										type="date"
										value={customEndDate}
										onChange={(e) => setCustomEndDate(e.target.value)}
										className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
									<button
										onClick={handleCustomRangeApply}
										className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-md text-white"
									>
										Apply
									</button>
								</div>
							)}
						</div>
					</div>

					{loading ? (
						<div className="flex justify-center items-center py-12">
							<Loader2 className="h-8 w-8 text-green-400 animate-spin" />
							<span className="ml-2 text-gray-400">Loading chart data...</span>
						</div>
					) : chartData.length === 0 ? (
						<div className="bg-gray-750 rounded-lg p-8 text-center">
							<TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-3" />
							<h3 className="text-lg font-medium text-gray-300 mb-1">
								No data available
							</h3>
							<p className="text-gray-400">
								No gas inventory records found for the selected date range
							</p>
						</div>
					) : (
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								{chartType === "line" ? (
									<LineChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
										<XAxis
											dataKey="date"
											stroke="#9CA3AF"
											tick={{ fill: "#9CA3AF" }}
											tickFormatter={formatDate}
										/>
										<YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
										<Tooltip
											formatter={(value) => [`${value} gallons`, ""]}
											labelFormatter={(label) => formatDate(label)}
											contentStyle={{
												backgroundColor: "#1F2937",
												borderColor: "#374151",
											}}
										/>
										<Legend />
										<Line
											type="monotone"
											dataKey="regular"
											name="Regular"
											stroke="#10B981"
											strokeWidth={2}
											dot={{ r: 4 }}
											activeDot={{ r: 6 }}
										/>
										<Line
											type="monotone"
											dataKey="mid"
											name="Mid-Grade"
											stroke="#3B82F6"
											strokeWidth={2}
											dot={{ r: 4 }}
											activeDot={{ r: 6 }}
										/>
										<Line
											type="monotone"
											dataKey="premium"
											name="Premium"
											stroke="#F59E0B"
											strokeWidth={2}
											dot={{ r: 4 }}
											activeDot={{ r: 6 }}
										/>
									</LineChart>
								) : (
									<BarChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
										<XAxis
											dataKey="date"
											stroke="#9CA3AF"
											tick={{ fill: "#9CA3AF" }}
											tickFormatter={formatDate}
										/>
										<YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
										<Tooltip
											formatter={(value) => [`${value} gallons`, ""]}
											labelFormatter={(label) => formatDate(label)}
											contentStyle={{
												backgroundColor: "#1F2937",
												borderColor: "#374151",
											}}
										/>
										<Legend />
										<Bar dataKey="regular" name="Regular" fill="#10B981" />
										<Bar dataKey="mid" name="Mid-Grade" fill="#3B82F6" />
										<Bar dataKey="premium" name="Premium" fill="#F59E0B" />
									</BarChart>
								)}
							</ResponsiveContainer>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default GasRecord;
