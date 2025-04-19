"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
	collection,
	addDoc,
	query,
	where,
	getDocs,
	Timestamp,
	doc,
	setDoc,
	getDoc,
} from "firebase/firestore";
import {
	Calculator,
	Calendar,
	Save,
	Settings,
	Ticket,
	X,
	ArrowDown,
	ArrowUp,
	Loader2,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";

interface TicketRow {
	id: number;
	value: number;
	yesterday: number;
	today: number;
	sold: number;
	total: number;
}

const getRollLimit = (value: number) => {
	if (value === 1) return 250;
	if (value === 2 || value === 3) return 150;
	if (value === 5) return 75;
	if (value === 10 || value === 20) return 25;
	return 0;
};

const TrackScratchOff: React.FC = () => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const isAdmin = user?.role === "admin";
	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 flex items-center justify-center text-center">
				<h2 className="text-2xl font-bold text-red-500">
					You are not allowed to view this page.
				</h2>
			</div>
		);
	}

	const [rows, setRows] = useState<TicketRow[]>(
		Array.from({ length: 30 }, (_, i) => ({
			id: i + 1,
			value: i < 6 ? 1 : i < 12 ? 2 : i < 18 ? 5 : i < 24 ? 10 : 20,
			yesterday: 0,
			today: 0,
			sold: 0,
			total: 0,
		}))
	);

	const [grandTotal, setGrandTotal] = useState(0);
	const [showSettings, setShowSettings] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [notification, setNotification] = useState<{
		show: boolean;
		message: string;
		type: "success" | "error";
	}>({ show: false, message: "", type: "success" });
	const [dateString, setDateString] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof TicketRow | null;
		direction: "ascending" | "descending";
	}>({ key: "id", direction: "ascending" });

	const getYesterdayDateString = () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return yesterday.toISOString().split("T")[0];
	};

	const loadYesterdayData = async () => {
		try {
			const q = query(
				collection(db, "scratchoffs"),
				where("dateString", "==", getYesterdayDateString())
			);
			const snapshot = await getDocs(q);
			if (!snapshot.empty) {
				const data = snapshot.docs[0].data();
				if (data.rows) {
					setRows((prevRows) =>
						prevRows.map((row) => {
							const yesterdayRow = data.rows.find(
								(r: TicketRow) => r.id === row.id
							);
							if (yesterdayRow) {
								return {
									...row,
									yesterday: yesterdayRow.today || 0,
								};
							}
							return row;
						})
					);
				}
			}
		} catch (error) {
			console.error("Error loading yesterday's data:", error);
			showNotification("Failed to load yesterday's data", "error");
		}
	};

	const loadSettings = async () => {
		try {
			const settingsDoc = await getDoc(
				doc(db, "scratchoff_settings", "ticketValues")
			);
			if (settingsDoc.exists()) {
				const settingsData = settingsDoc.data();
				setRows((prevRows) =>
					prevRows.map((row) => {
						const match = settingsData.values.find((v: any) => v.id === row.id);
						return {
							...row,
							value: match ? match.value : row.value,
						};
					})
				);
			}
		} catch (error) {
			console.error("Error loading settings:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadDataForSelectedDate = async (selectedDate: string) => {
		try {
			const q = query(
				collection(db, "scratchoffs"),
				where("dateString", "==", selectedDate)
			);
			const snapshot = await getDocs(q);
			let currentRows = [...rows];

			if (!snapshot.empty) {
				const data = snapshot.docs[0].data();
				if (data.rows) {
					currentRows = data.rows;
					showNotification(`Loaded data for ${selectedDate}`, "success");
				}
			}

			if (selectedDate !== new Date().toISOString().split("T")[0]) {
				const selected = new Date(selectedDate);
				selected.setDate(selected.getDate() - 1);
				const prevDateString = selected.toISOString().split("T")[0];

				const qPrev = query(
					collection(db, "scratchoffs"),
					where("dateString", "==", prevDateString)
				);
				const prevSnapshot = await getDocs(qPrev);

				if (!prevSnapshot.empty) {
					const prevData = prevSnapshot.docs[0].data();
					if (prevData.rows) {
						currentRows = currentRows.map((row: TicketRow) => {
							const prevMatch = prevData.rows.find(
								(r: TicketRow) => r.id === row.id
							);
							return {
								...row,
								yesterday: prevMatch ? prevMatch.today : row.yesterday,
							};
						});
					}
				}
			}

			setRows(currentRows);
		} catch (error) {
			console.error("Failed to load data for selected date:", error);
			showNotification("Failed to load selected date's data", "error");
		}
	};

	useEffect(() => {
		const loadData = async () => {
			await Promise.all([loadYesterdayData(), loadSettings()]);
		};
		loadData();
	}, []);

	const handleChange = (
		index: number,
		field: "value" | "yesterday" | "today",
		newValue: number
	) => {
		setRows((prevRows) => {
			const updated = [...prevRows];
			updated[index][field] = newValue;
			const yesterday = updated[index].yesterday;
			const today = updated[index].today;
			const rollLimit = getRollLimit(updated[index].value);

			let sold = 0;
			if (today >= yesterday) {
				sold = today - yesterday;
			} else {
				sold = today + rollLimit - yesterday;
			}

			updated[index].sold = sold > 0 ? sold : 0;
			updated[index].total = updated[index].sold * updated[index].value;
			return updated;
		});
	};

	useEffect(() => {
		const sum = rows.reduce((acc, r) => acc + r.total, 0);
		setGrandTotal(sum);
	}, [rows]);

	const handleSaveSettings = async () => {
		try {
			setSaving(true);
			const updatedValues = rows
				.map(({ id, value }) => ({ id, value }))
				.filter((item) => typeof item.value === "number" && !isNaN(item.value));

			await setDoc(doc(db, "scratchoff_settings", "ticketValues"), {
				values: updatedValues,
				updatedAt: Timestamp.now(),
			});

			showNotification("Settings saved successfully!", "success");
			setShowSettings(false);
		} catch (error) {
			console.error("Failed to save settings:", error);
			showNotification("Failed to save settings", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			const payload = {
				rows,
				date: Timestamp.now(),
				dateString,
				grandTotal,
			};
			await addDoc(collection(db, "scratchoffs"), payload);
			showNotification("Scratch-off data saved successfully!", "success");
		} catch (error) {
			console.error("Failed to save data:", error);
			showNotification("Failed to save data", "error");
		} finally {
			setSaving(false);
		}
	};

	const showNotification = (message: string, type: "success" | "error") => {
		setNotification({ show: true, message, type });
		setTimeout(() => {
			setNotification({ show: false, message: "", type: "success" });
		}, 3000);
	};

	const handleSort = (key: keyof TicketRow) => {
		let direction: "ascending" | "descending" = "ascending";

		if (sortConfig.key === key && sortConfig.direction === "ascending") {
			direction = "descending";
		}

		setSortConfig({ key, direction });
	};

	const sortedRows = React.useMemo(() => {
		const sortableRows = [...rows];
		if (sortConfig.key !== null) {
			sortableRows.sort((a, b) => {
				if (a[sortConfig.key!] < b[sortConfig.key!]) {
					return sortConfig.direction === "ascending" ? -1 : 1;
				}
				if (a[sortConfig.key!] > b[sortConfig.key!]) {
					return sortConfig.direction === "ascending" ? 1 : -1;
				}
				return 0;
			});
		}
		return sortableRows;
	}, [rows, sortConfig]);

	const getSortIcon = (key: keyof TicketRow) => {
		if (sortConfig.key !== key) {
			return null;
		}
		return sortConfig.direction === "ascending" ? (
			<ArrowUp className="h-3 w-3 ml-1 inline" />
		) : (
			<ArrowDown className="h-3 w-3 ml-1 inline" />
		);
	};

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
						<Ticket className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">
							Scratch-Off Tracker
						</h1>
					</div>

					<div className="flex flex-wrap gap-3">
						<div className="flex items-center bg-gray-800 rounded-md px-3 py-2">
							<Calendar className="h-4 w-4 text-gray-400 mr-2" />
							<input
								type="date"
								className="bg-transparent border-none text-sm focus:outline-none focus:ring-0"
								value={dateString}
								onChange={(e) => {
									const selected = e.target.value;
									setDateString(selected);
									loadDataForSelectedDate(selected);
								}}
							/>
						</div>
						<button
							className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
								showSettings
									? "bg-gray-700 text-white hover:bg-gray-600"
									: "bg-gray-800 text-white hover:bg-gray-700"
							}`}
							onClick={() => setShowSettings((prev) => !prev)}
						>
							{showSettings ? (
								<X className="h-4 w-4" />
							) : (
								<Settings className="h-4 w-4" />
							)}
							<span>{showSettings ? "Close Settings" : "Settings"}</span>
						</button>
						<button
							className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={handleSave}
							disabled={saving}
						>
							{saving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Save className="h-4 w-4" />
							)}
							<span>{saving ? "Saving..." : "Save Data"}</span>
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
					<div className="bg-gray-800 rounded-lg p-4 shadow-lg lg:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<Calculator className="h-5 w-5 text-green-400" />
							<h2 className="text-xl font-semibold">Total Scratch-Off Sales</h2>
						</div>
						<div className="flex flex-col">
							<p className="text-sm text-gray-400 mb-2">
								Based on the quantity sold and ticket values
							</p>
							<p className="text-3xl font-bold text-green-400">
								${grandTotal.toFixed(2)}
							</p>
						</div>
					</div>

					<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
						<div className="flex items-center gap-2 mb-4">
							<Calendar className="h-5 w-5 text-green-400" />
							<h2 className="text-xl font-semibold">Quick Stats</h2>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-400">Total Tickets Sold</p>
								<p className="text-xl font-bold">
									{rows.reduce((acc, row) => acc + row.sold, 0)}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-400">Avg. Ticket Value</p>
								<p className="text-xl font-bold">
									$
									{rows.reduce((acc, row) => acc + row.value, 0) / rows.length >
									0
										? (
												rows.reduce((acc, row) => acc + row.value, 0) /
												rows.length
										  ).toFixed(2)
										: "0.00"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-400">Most Sold Ticket</p>
								<p className="text-xl font-bold">
									#
									{
										rows.reduce(
											(prev, current) =>
												prev.sold > current.sold ? prev : current,
											{
												id: 0,
												sold: 0,
											} as TicketRow
										).id
									}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-400">Highest Value</p>
								<p className="text-xl font-bold">
									$
									{rows
										.reduce(
											(prev, current) =>
												prev.total > current.total ? prev : current,
											{
												id: 0,
												total: 0,
											} as TicketRow
										)
										.total.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{showSettings && (
					<div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<Settings className="h-5 w-5 text-green-400" />
								<h2 className="text-xl font-semibold">Ticket Value Settings</h2>
							</div>
							<button
								className="text-gray-400 hover:text-white"
								onClick={() => setShowSettings(false)}
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<p className="text-sm text-gray-400 mb-4">
							Configure the dollar value for each scratch-off ticket
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
							{rows.map((row, index) => (
								<div
									key={`setting-${row.id}`}
									className="bg-gray-700 p-3 rounded-md"
								>
									<label className="block text-sm mb-1 text-gray-300">
										Ticket #{row.id}
									</label>
									<div className="flex items-center">
										<span className="text-gray-400 mr-1">$</span>
										<input
											type="number"
											className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
											value={row.value}
											onChange={(e) =>
												handleChange(
													index,
													"value",
													Number.parseFloat(e.target.value) || 0
												)
											}
										/>
									</div>
								</div>
							))}
						</div>
						<div className="mt-6 flex justify-end">
							<button
								className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								onClick={handleSaveSettings}
								disabled={saving}
							>
								{saving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Save className="h-4 w-4" />
								)}
								<span>{saving ? "Saving..." : "Save Settings"}</span>
							</button>
						</div>
					</div>
				)}

				<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
					<div className="flex items-center gap-2 mb-4">
						<Ticket className="h-5 w-5 text-green-400" />
						<h2 className="text-xl font-semibold">Scratch-Off Inventory</h2>
					</div>
					<p className="text-sm text-gray-400 mb-4">
						Enter yesterday's and today's counts to calculate sales
					</p>

					{loading ? (
						<div className="flex justify-center items-center py-12">
							<Loader2 className="h-8 w-8 text-green-400 animate-spin" />
							<span className="ml-2 text-gray-400">Loading data...</span>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-gray-400 border-b border-gray-700">
										<th
											className="py-3 px-4 cursor-pointer"
											onClick={() => handleSort("id")}
										>
											Ticket # {getSortIcon("id")}
										</th>
										<th
											className="py-3 px-4 cursor-pointer"
											onClick={() => handleSort("value")}
										>
											Value ($) {getSortIcon("value")}
										</th>
										<th
											className="py-3 px-4 cursor-pointer"
											onClick={() => handleSort("yesterday")}
										>
											Yesterday End # {getSortIcon("yesterday")}
										</th>
										<th
											className="py-3 px-4 cursor-pointer"
											onClick={() => handleSort("today")}
										>
											Today End # {getSortIcon("today")}
										</th>
										<th
											className="py-3 px-4 cursor-pointer"
											onClick={() => handleSort("sold")}
										>
											Sold {getSortIcon("sold")}
										</th>
										<th
											className="py-3 px-4 cursor-pointer"
											onClick={() => handleSort("total")}
										>
											Total ($) {getSortIcon("total")}
										</th>
									</tr>
								</thead>
								<tbody>
									{sortedRows.map((row, _index) => {
										const originalIndex = rows.findIndex(
											(r) => r.id === row.id
										);
										return (
											<tr
												key={row.id}
												className={`border-b border-gray-800 hover:bg-gray-750 ${
													row.sold > 0 ? "bg-gray-750/30" : ""
												}`}
											>
												<td className="py-2 px-4">{row.id}</td>
												<td className="py-2 px-4">
													<div className="flex items-center">
														<span className="text-gray-400 mr-1">$</span>
														<input
															type="number"
															className="w-16 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
															value={row.value}
															readOnly
														/>
													</div>
												</td>
												<td className="py-2 px-4">
													<input
														type="number"
														className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
														value={row.yesterday}
														readOnly
													/>
												</td>
												<td className="py-2 px-4">
													<input
														type="number"
														className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
														value={row.today}
														onChange={(e) =>
															handleChange(
																originalIndex,
																"today",
																Number.parseFloat(e.target.value) || 0
															)
														}
													/>
												</td>
												<td
													className={`py-2 px-4 font-medium ${
														row.sold > 0 ? "text-green-400" : ""
													}`}
												>
													{row.sold}
												</td>
												<td
													className={`py-2 px-4 font-medium ${
														row.total > 0 ? "text-green-400" : ""
													}`}
												>
													${row.total.toFixed(2)}
												</td>
											</tr>
										);
									})}
									<tr className="font-semibold text-white border-t border-gray-600 bg-gray-750">
										<td colSpan={4} className="text-right py-3 px-4">
											Total Tickets Sold:
										</td>
										<td className="py-3 px-4 text-green-400">
											{rows.reduce((acc, r) => acc + r.sold, 0)}
										</td>
										<td className="py-3 px-4 text-green-400">
											${grandTotal.toFixed(2)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TrackScratchOff;
