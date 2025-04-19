"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import {
	addDoc,
	collection,
	getDocs,
	query,
	orderBy,
	Timestamp,
	updateDoc,
	doc,
	deleteDoc,
} from "firebase/firestore";
import {
	ClipboardList,
	Plus,
	Search,
	Filter,
	Loader2,
	CheckCircle2,
	Clock,
	XCircle,
	Trash2,
	Edit,
	Save,
	X,
	AlertCircle,
} from "lucide-react";

interface CustomerRequestItem {
	id: string;
	text: string;
	category: string;
	status: "pending" | "completed" | "cancelled";
	createdAt: Timestamp;
	notes?: string;
}

const categories = [
	"Grocery",
	"Beverages",
	"Snacks",
	"Tobacco",
	"Household",
	"Personal Care",
	"Other",
];

const CustomerRequest: React.FC = () => {
	const [requests, setRequests] = useState<CustomerRequestItem[]>([]);
	const [newRequest, setNewRequest] = useState("");
	const [newCategory, setNewCategory] = useState("Other");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [notification, setNotification] = useState<{
		show: boolean;
		message: string;
		type: "success" | "error";
	}>({ show: false, message: "", type: "success" });
	const [editingRequest, setEditingRequest] =
		useState<CustomerRequestItem | null>(null);
	const [notes, setNotes] = useState("");

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchRequests();
	}, []);

	const fetchRequests = async () => {
		try {
			setLoading(true);
			const q = query(
				collection(db, "customerRequests"),
				orderBy("createdAt", "desc")
			);
			const snapshot = await getDocs(q);
			const fetchedRequests: CustomerRequestItem[] = snapshot.docs.map(
				(doc) => ({
					id: doc.id,
					text: doc.data().text || "",
					category: doc.data().category || "Other",
					status: doc.data().status || "pending",
					createdAt: doc.data().createdAt || Timestamp.now(),
					notes: doc.data().notes || "",
				})
			);
			setRequests(fetchedRequests);
		} catch (error) {
			console.error("Error fetching requests:", error);
			showNotification("Failed to load requests", "error");
		} finally {
			setLoading(false);
		}
	};

	const addRequest = async () => {
		if (newRequest.trim() !== "") {
			try {
				setSaving(true);
				const requestData = {
					text: newRequest.trim(),
					category: newCategory,
					status: "pending",
					createdAt: Timestamp.now(),
				};

				const docRef = await addDoc(
					collection(db, "customerRequests"),
					requestData
				);

				setRequests((prev) => [
					{
						id: docRef.id,
						...requestData,
						status: "pending" as const,
					},
					...prev,
				]);

				setNewRequest("");
				setNewCategory("Other");
				showNotification("Request added successfully", "success");

				// Focus back on input for quick entry of multiple items
				if (inputRef.current) {
					inputRef.current.focus();
				}
			} catch (error) {
				console.error("Error adding request:", error);
				showNotification("Failed to add request", "error");
			} finally {
				setSaving(false);
			}
		}
	};

	const updateRequestStatus = async (
		id: string,
		status: "pending" | "completed" | "cancelled"
	) => {
		try {
			await updateDoc(doc(db, "customerRequests", id), { status });
			setRequests((prev) =>
				prev.map((request) =>
					request.id === id ? { ...request, status } : request
				)
			);
			showNotification(`Request marked as ${status}`, "success");
		} catch (error) {
			console.error("Error updating request status:", error);
			showNotification("Failed to update request status", "error");
		}
	};

	const deleteRequest = async (id: string) => {
		if (window.confirm("Are you sure you want to delete this request?")) {
			try {
				await deleteDoc(doc(db, "customerRequests", id));
				setRequests((prev) => prev.filter((request) => request.id !== id));
				showNotification("Request deleted successfully", "success");
			} catch (error) {
				console.error("Error deleting request:", error);
				showNotification("Failed to delete request", "error");
			}
		}
	};

	const startEditing = (request: CustomerRequestItem) => {
		setEditingRequest(request);
		setNotes(request.notes || "");
	};

	const saveEdit = async () => {
		if (!editingRequest) return;

		try {
			await updateDoc(doc(db, "customerRequests", editingRequest.id), {
				text: editingRequest.text,
				category: editingRequest.category,
				notes,
			});

			setRequests((prev) =>
				prev.map((request) =>
					request.id === editingRequest.id
						? { ...editingRequest, notes }
						: request
				)
			);

			setEditingRequest(null);
			showNotification("Request updated successfully", "success");
		} catch (error) {
			console.error("Error updating request:", error);
			showNotification("Failed to update request", "error");
		}
	};

	const cancelEdit = () => {
		setEditingRequest(null);
	};

	const showNotification = (message: string, type: "success" | "error") => {
		setNotification({ show: true, message, type });
		setTimeout(() => {
			setNotification({ show: false, message: "", type: "success" });
		}, 3000);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			addRequest();
		}
	};

	const filteredRequests = requests.filter((request) => {
		const matchesSearch =
			request.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.category.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || request.status === statusFilter;
		const matchesCategory =
			categoryFilter === "all" || request.category === categoryFilter;

		return matchesSearch && matchesStatus && matchesCategory;
	});

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle2 className="h-5 w-5 text-green-400" />;
			case "cancelled":
				return <XCircle className="h-5 w-5 text-red-400" />;
			default:
				return <Clock className="h-5 w-5 text-yellow-400" />;
		}
	};

	const formatDate = (timestamp: Timestamp) => {
		const date = timestamp.toDate();
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
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
						<ClipboardList className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">
							Customer Requests
						</h1>
					</div>
				</div>

				<div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<Plus className="h-5 w-5 text-green-400" />
						Add New Request
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
						<div className="md:col-span-2">
							<label
								htmlFor="request-text"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Request Item
							</label>
							<input
								id="request-text"
								ref={inputRef}
								type="text"
								value={newRequest}
								onChange={(e) => setNewRequest(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Enter customer request..."
								className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>

						<div>
							<label
								htmlFor="request-category"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Category
							</label>
							<select
								id="request-category"
								value={newCategory}
								onChange={(e) => setNewCategory(e.target.value)}
								className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="flex justify-end">
						<button
							onClick={addRequest}
							disabled={saving || newRequest.trim() === ""}
							className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Plus className="h-4 w-4" />
							)}
							Add Request
						</button>
					</div>
				</div>

				<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
					<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
						<h2 className="text-xl font-semibold flex items-center gap-2">
							<ClipboardList className="h-5 w-5 text-green-400" />
							Request List
						</h2>

						<div className="flex flex-col sm:flex-row gap-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search requests..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
								/>
							</div>

							<div className="flex gap-2">
								<div className="relative">
									<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<select
										value={statusFilter}
										onChange={(e) => setStatusFilter(e.target.value)}
										className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									>
										<option value="all">All Status</option>
										<option value="pending">Pending</option>
										<option value="completed">Completed</option>
										<option value="cancelled">Cancelled</option>
									</select>
								</div>

								<select
									value={categoryFilter}
									onChange={(e) => setCategoryFilter(e.target.value)}
									className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									<option value="all">All Categories</option>
									{categories.map((category) => (
										<option key={category} value={category}>
											{category}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="flex justify-center items-center py-12">
							<Loader2 className="h-8 w-8 text-green-400 animate-spin" />
							<span className="ml-2 text-gray-400">Loading requests...</span>
						</div>
					) : filteredRequests.length === 0 ? (
						<div className="bg-gray-750 rounded-lg p-8 text-center">
							<ClipboardList className="h-12 w-12 text-gray-500 mx-auto mb-3" />
							<h3 className="text-lg font-medium text-gray-300 mb-1">
								No requests found
							</h3>
							<p className="text-gray-400">
								{searchTerm ||
								statusFilter !== "all" ||
								categoryFilter !== "all"
									? "Try adjusting your filters or search term"
									: "Add your first customer request above"}
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredRequests.map((request) => (
								<div
									key={request.id}
									className={`bg-gray-750 rounded-lg border ${
										request.status === "pending"
											? "border-yellow-700/30"
											: request.status === "completed"
											? "border-green-700/30"
											: "border-red-700/30"
									}`}
								>
									{editingRequest?.id === request.id ? (
										<div className="p-4">
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
												<div className="md:col-span-2">
													<label className="block text-sm font-medium text-gray-400 mb-1">
														Request Item
													</label>
													<input
														type="text"
														value={editingRequest.text}
														onChange={(e) =>
															setEditingRequest({
																...editingRequest,
																text: e.target.value,
															})
														}
														className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-400 mb-1">
														Category
													</label>
													<select
														value={editingRequest.category}
														onChange={(e) =>
															setEditingRequest({
																...editingRequest,
																category: e.target.value,
															})
														}
														className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
													>
														{categories.map((category) => (
															<option key={category} value={category}>
																{category}
															</option>
														))}
													</select>
												</div>
											</div>

											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-400 mb-1">
													Notes
												</label>
												<textarea
													value={notes}
													onChange={(e) => setNotes(e.target.value)}
													rows={3}
													className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
													placeholder="Add notes about this request..."
												/>
											</div>

											<div className="flex justify-end gap-2">
												<button
													onClick={cancelEdit}
													className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 flex items-center gap-2"
												>
													<X className="h-4 w-4" />
													Cancel
												</button>
												<button
													onClick={saveEdit}
													className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 flex items-center gap-2"
												>
													<Save className="h-4 w-4" />
													Save Changes
												</button>
											</div>
										</div>
									) : (
										<>
											<div className="p-4">
												<div className="flex flex-wrap justify-between gap-2 mb-2">
													<div className="flex items-center gap-2">
														<span
															className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																request.status === "pending"
																	? "bg-yellow-900/30 text-yellow-300"
																	: request.status === "completed"
																	? "bg-green-900/30 text-green-300"
																	: "bg-red-900/30 text-red-300"
															}`}
														>
															{getStatusIcon(request.status)}
															<span className="ml-1 capitalize">
																{request.status}
															</span>
														</span>
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-700 text-xs font-medium text-gray-300">
															{request.category}
														</span>
													</div>
													<span className="text-xs text-gray-400">
														{formatDate(request.createdAt)}
													</span>
												</div>

												<h3 className="text-lg font-medium mb-2">
													{request.text}
												</h3>

												{request.notes && (
													<div className="mt-2 text-sm text-gray-400 bg-gray-800/50 p-3 rounded-md">
														<p className="font-medium text-gray-300 mb-1">
															Notes:
														</p>
														<p>{request.notes}</p>
													</div>
												)}
											</div>

											<div className="border-t border-gray-700 px-4 py-2 flex flex-wrap justify-end gap-2">
												{request.status === "pending" && (
													<>
														<button
															onClick={() =>
																updateRequestStatus(request.id, "completed")
															}
															className="px-3 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 text-sm flex items-center gap-1"
														>
															<CheckCircle2 className="h-3.5 w-3.5" />
															Mark Complete
														</button>
														<button
															onClick={() =>
																updateRequestStatus(request.id, "cancelled")
															}
															className="px-3 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm flex items-center gap-1"
														>
															<XCircle className="h-3.5 w-3.5" />
															Cancel
														</button>
													</>
												)}

												<button
													onClick={() => startEditing(request)}
													className="px-3 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-sm flex items-center gap-1"
												>
													<Edit className="h-3.5 w-3.5" />
													Edit
												</button>
												<button
													onClick={() => deleteRequest(request.id)}
													className="px-3 py-1 rounded bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 text-sm flex items-center gap-1"
												>
													<Trash2 className="h-3.5 w-3.5" />
													Delete
												</button>
											</div>
										</>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CustomerRequest;
