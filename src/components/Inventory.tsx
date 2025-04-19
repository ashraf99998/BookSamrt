"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import {
	addDoc,
	collection,
	doc,
	getDocs,
	onSnapshot,
	updateDoc,
	deleteDoc,
	query,
	orderBy,
} from "firebase/firestore";
import {
	Package,
	Search,
	Plus,
	Save,
	Trash2,
	Edit,
	X,
	CheckCircle2,
	AlertCircle,
	ArrowUpDown,
	Loader2,
	Filter,
	Tag,
} from "lucide-react";

type Item = {
	id: string;
	name: string;
	price: number;
	category: string;
	stock: number;
	barcode?: string;
	createdAt: Date;
	updatedAt?: Date;
};

const categories = [
	"Grocery",
	"Beverages",
	"Snacks",
	"Tobacco",
	"Household",
	"Personal Care",
	"Electronics",
	"Other",
];

const Inventory: React.FC = () => {
	const [items, setItems] = useState<Item[]>([]);
	const [newItem, setNewItem] = useState("");
	const [newPrice, setNewPrice] = useState("");
	const [newCategory, setNewCategory] = useState("Other");
	const [newStock, setNewStock] = useState("");
	const [newBarcode, setNewBarcode] = useState("");
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [stockFilter, setStockFilter] = useState("all");
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Item | null;
		direction: "ascending" | "descending";
	}>({ key: "name", direction: "ascending" });
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingItem, setEditingItem] = useState<Item | null>(null);
	const [notification, setNotification] = useState<{
		show: boolean;
		message: string;
		type: "success" | "error";
	}>({ show: false, message: "", type: "success" });

	const nameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const fetchItems = async () => {
			try {
				setLoading(true);
				const q = query(collection(db, "inventory"), orderBy("name"));
				const snapshot = await getDocs(q);
				const docs = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate() || new Date(),
					updatedAt: doc.data().updatedAt?.toDate(),
				})) as Item[];
				setItems(docs);
			} catch (error) {
				console.error("Error fetching inventory:", error);
				showNotification("Failed to load inventory items", "error");
			} finally {
				setLoading(false);
			}
		};

		fetchItems();

		// Set up real-time listener for updates
		const unsubscribe = onSnapshot(collection(db, "inventory"), (snapshot) => {
			const updatedItems = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
				createdAt: doc.data().createdAt?.toDate() || new Date(),
				updatedAt: doc.data().updatedAt?.toDate(),
			})) as Item[];
			setItems(updatedItems);
		});

		return () => unsubscribe();
	}, []);

	const addItem = async () => {
		if (newItem.trim() && !isNaN(Number(newPrice))) {
			try {
				setSaving(true);
				const itemData = {
					name: newItem.trim(),
					price: Number.parseFloat(newPrice),
					category: newCategory,
					stock: Number.parseInt(newStock) || 0,
					barcode: newBarcode.trim() || null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				await addDoc(collection(db, "inventory"), itemData);

				showNotification(`${newItem} added to inventory`, "success");

				// Reset form
				setNewItem("");
				setNewPrice("");
				setNewStock("");
				setNewBarcode("");
				setNewCategory("Other");

				// Focus back on name input for quick entry
				if (nameInputRef.current) {
					nameInputRef.current.focus();
				}
			} catch (error) {
				console.error("Error adding item:", error);
				showNotification("Failed to add item", "error");
			} finally {
				setSaving(false);
			}
		} else {
			showNotification("Please enter a valid item name and price", "error");
		}
	};

	// const updateItem = async (id: string, data: Partial<Item>) => {
	// 	try {
	// 		await updateDoc(doc(db, "inventory", id), {
	// 			...data,
	// 			updatedAt: new Date(),
	// 		});
	// 		showNotification("Item updated successfully", "success");
	// 	} catch (error) {
	// 		console.error("Error updating item:", error);
	// 		showNotification("Failed to update item", "error");
	// 	}
	// };

	const deleteItem = async (id: string, name: string) => {
		if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
			try {
				await deleteDoc(doc(db, "inventory", id));
				showNotification(`${name} removed from inventory`, "success");
			} catch (error) {
				console.error("Error deleting item:", error);
				showNotification("Failed to delete item", "error");
			}
		}
	};

	const handleSort = (key: keyof Item) => {
		let direction: "ascending" | "descending" = "ascending";

		if (sortConfig.key === key && sortConfig.direction === "ascending") {
			direction = "descending";
		}

		setSortConfig({ key, direction });
	};

	const showNotification = (message: string, type: "success" | "error") => {
		setNotification({ show: true, message, type });
		setTimeout(() => {
			setNotification({ show: false, message: "", type: "success" });
		}, 3000);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			addItem();
		}
	};

	const startEditing = (item: Item) => {
		setEditingItem({ ...item });
	};

	const cancelEditing = () => {
		setEditingItem(null);
	};

	const saveEditing = async () => {
		if (!editingItem) return;

		try {
			await updateDoc(doc(db, "inventory", editingItem.id), {
				name: editingItem.name,
				price: editingItem.price,
				category: editingItem.category,
				stock: editingItem.stock,
				barcode: editingItem.barcode || null,
				updatedAt: new Date(),
			});

			showNotification("Item updated successfully", "success");
			setEditingItem(null);
		} catch (error) {
			console.error("Error updating item:", error);
			showNotification("Failed to update item", "error");
		}
	};

	// Filter and sort items
	const filteredItems = items
		.filter((item) => {
			const matchesSearch =
				item.name.toLowerCase().includes(search.toLowerCase()) ||
				(item.barcode && item.barcode.includes(search));

			const matchesCategory =
				categoryFilter === "all" || item.category === categoryFilter;

			const matchesStock =
				stockFilter === "all" ||
				(stockFilter === "inStock" && item.stock > 0) ||
				(stockFilter === "lowStock" && item.stock > 0 && item.stock <= 5) ||
				(stockFilter === "outOfStock" && item.stock === 0);

			return matchesSearch && matchesCategory && matchesStock;
		})
		.sort((a, b) => {
			if (sortConfig.key === null) return 0;

			const aValue = a[sortConfig.key];
			const bValue = b[sortConfig.key];

			// Ensure null/undefined safety
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return sortConfig.direction === "ascending" ? -1 : 1;
			if (bValue == null) return sortConfig.direction === "ascending" ? 1 : -1;

			if (typeof aValue === "string" && typeof bValue === "string") {
				const aStr = aValue.toLowerCase();
				const bStr = bValue.toLowerCase();
				return sortConfig.direction === "ascending"
					? aStr.localeCompare(bStr)
					: bStr.localeCompare(aStr);
			}

			if (typeof aValue === "number" && typeof bValue === "number") {
				if (aValue < bValue)
					return sortConfig.direction === "ascending" ? -1 : 1;
				if (aValue > bValue)
					return sortConfig.direction === "ascending" ? 1 : -1;
				return 0;
			}

			return 0;
		});

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
						<Package className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">
							Inventory Management
						</h1>
					</div>
				</div>

				{/* Add New Item Form */}
				<div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<Plus className="h-5 w-5 text-green-400" />
						Add New Item
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
						<div className="lg:col-span-2">
							<label
								htmlFor="item-name"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Item Name*
							</label>
							<input
								id="item-name"
								ref={nameInputRef}
								type="text"
								value={newItem}
								onChange={(e) => setNewItem(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Enter item name"
								className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>

						<div>
							<label
								htmlFor="item-price"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Price*
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
									$
								</span>
								<input
									id="item-price"
									type="number"
									step="0.01"
									min="0"
									value={newPrice}
									onChange={(e) => setNewPrice(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="0.00"
									className="w-full pl-7 pr-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="item-category"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Category
							</label>
							<select
								id="item-category"
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

						<div>
							<label
								htmlFor="item-stock"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Stock
							</label>
							<input
								id="item-stock"
								type="number"
								min="0"
								value={newStock}
								onChange={(e) => setNewStock(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="0"
								className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label
								htmlFor="item-barcode"
								className="block text-sm font-medium text-gray-400 mb-1"
							>
								Barcode (Optional)
							</label>
							<input
								id="item-barcode"
								type="text"
								value={newBarcode}
								onChange={(e) => setNewBarcode(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Enter barcode"
								className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>
					</div>

					<div className="flex justify-end">
						<button
							onClick={addItem}
							disabled={saving || !newItem.trim() || !newPrice.trim()}
							className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Plus className="h-4 w-4" />
							)}
							Add Item
						</button>
					</div>
				</div>

				{/* Inventory List */}
				<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
					<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
						<h2 className="text-xl font-semibold flex items-center gap-2">
							<Package className="h-5 w-5 text-green-400" />
							Inventory Items
						</h2>

						<div className="flex flex-col sm:flex-row gap-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search by name or barcode..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
								/>
							</div>

							<div className="flex gap-2">
								<div className="relative">
									<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<select
										value={categoryFilter}
										onChange={(e) => setCategoryFilter(e.target.value)}
										className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									>
										<option value="all">All Categories</option>
										{categories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
								</div>

								<select
									value={stockFilter}
									onChange={(e) => setStockFilter(e.target.value)}
									className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									<option value="all">All Stock</option>
									<option value="inStock">In Stock</option>
									<option value="lowStock">Low Stock (≤ 5)</option>
									<option value="outOfStock">Out of Stock</option>
								</select>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="flex justify-center items-center py-12">
							<Loader2 className="h-8 w-8 text-green-400 animate-spin" />
							<span className="ml-2 text-gray-400">Loading inventory...</span>
						</div>
					) : filteredItems.length === 0 ? (
						<div className="bg-gray-750 rounded-lg p-8 text-center">
							<Package className="h-12 w-12 text-gray-500 mx-auto mb-3" />
							<h3 className="text-lg font-medium text-gray-300 mb-1">
								No items found
							</h3>
							<p className="text-gray-400">
								{search || categoryFilter !== "all" || stockFilter !== "all"
									? "Try adjusting your filters or search term"
									: "Add your first inventory item above"}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-gray-400 border-b border-gray-700">
										<th
											className="py-3 px-4 cursor-pointer whitespace-nowrap"
											onClick={() => handleSort("name")}
										>
											<div className="flex items-center">
												Item Name
												{sortConfig.key === "name" && (
													<ArrowUpDown
														className={`h-4 w-4 ml-1 ${
															sortConfig.direction === "ascending"
																? "rotate-0"
																: "rotate-180"
														}`}
													/>
												)}
											</div>
										</th>
										<th
											className="py-3 px-4 cursor-pointer whitespace-nowrap"
											onClick={() => handleSort("price")}
										>
											<div className="flex items-center">
												Price
												{sortConfig.key === "price" && (
													<ArrowUpDown
														className={`h-4 w-4 ml-1 ${
															sortConfig.direction === "ascending"
																? "rotate-0"
																: "rotate-180"
														}`}
													/>
												)}
											</div>
										</th>
										<th
											className="py-3 px-4 cursor-pointer whitespace-nowrap"
											onClick={() => handleSort("category")}
										>
											<div className="flex items-center">
												Category
												{sortConfig.key === "category" && (
													<ArrowUpDown
														className={`h-4 w-4 ml-1 ${
															sortConfig.direction === "ascending"
																? "rotate-0"
																: "rotate-180"
														}`}
													/>
												)}
											</div>
										</th>
										<th
											className="py-3 px-4 cursor-pointer whitespace-nowrap"
											onClick={() => handleSort("stock")}
										>
											<div className="flex items-center">
												Stock
												{sortConfig.key === "stock" && (
													<ArrowUpDown
														className={`h-4 w-4 ml-1 ${
															sortConfig.direction === "ascending"
																? "rotate-0"
																: "rotate-180"
														}`}
													/>
												)}
											</div>
										</th>
										<th className="py-3 px-4 whitespace-nowrap">Barcode</th>
										<th className="py-3 px-4 text-right whitespace-nowrap">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredItems.map((item) => (
										<tr
											key={item.id}
											className={`border-b border-gray-800 hover:bg-gray-750 ${
												item.stock === 0
													? "bg-red-900/10"
													: item.stock <= 5
													? "bg-yellow-900/10"
													: ""
											}`}
										>
											{editingItem?.id === item.id ? (
												// Editing mode
												<>
													<td className="py-2 px-4">
														<input
															type="text"
															value={editingItem.name}
															onChange={(e) =>
																setEditingItem({
																	...editingItem,
																	name: e.target.value,
																})
															}
															className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
														/>
													</td>
													<td className="py-2 px-4">
														<div className="relative">
															<span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
																$
															</span>
															<input
																type="number"
																step="0.01"
																min="0"
																value={editingItem.price}
																onChange={(e) =>
																	setEditingItem({
																		...editingItem,
																		price:
																			Number.parseFloat(e.target.value) || 0,
																	})
																}
																className="w-full pl-6 pr-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
															/>
														</div>
													</td>
													<td className="py-2 px-4">
														<select
															value={editingItem.category}
															onChange={(e) =>
																setEditingItem({
																	...editingItem,
																	category: e.target.value,
																})
															}
															className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
														>
															{categories.map((category) => (
																<option key={category} value={category}>
																	{category}
																</option>
															))}
														</select>
													</td>
													<td className="py-2 px-4">
														<input
															type="number"
															min="0"
															value={editingItem.stock}
															onChange={(e) =>
																setEditingItem({
																	...editingItem,
																	stock: Number.parseInt(e.target.value) || 0,
																})
															}
															className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
														/>
													</td>
													<td className="py-2 px-4">
														<input
															type="text"
															value={editingItem.barcode || ""}
															onChange={(e) =>
																setEditingItem({
																	...editingItem,
																	barcode: e.target.value,
																})
															}
															className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
															placeholder="No barcode"
														/>
													</td>
													<td className="py-2 px-4 text-right whitespace-nowrap">
														<div className="flex justify-end gap-2">
															<button
																onClick={saveEditing}
																className="p-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded"
																title="Save"
															>
																<Save className="h-4 w-4" />
															</button>
															<button
																onClick={cancelEditing}
																className="p-1 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 rounded"
																title="Cancel"
															>
																<X className="h-4 w-4" />
															</button>
														</div>
													</td>
												</>
											) : (
												// View mode
												<>
													<td className="py-3 px-4 font-medium">{item.name}</td>
													<td className="py-3 px-4">
														${item.price.toFixed(2)}
													</td>
													<td className="py-3 px-4">
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
															<Tag className="h-3 w-3 mr-1" />
															{item.category}
														</span>
													</td>
													<td className="py-3 px-4">
														<span
															className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
																item.stock === 0
																	? "bg-red-900/30 text-red-300"
																	: item.stock <= 5
																	? "bg-yellow-900/30 text-yellow-300"
																	: "bg-green-900/30 text-green-300"
															}`}
														>
															{item.stock === 0
																? "Out of stock"
																: item.stock <= 5
																? `Low: ${item.stock}`
																: item.stock}
														</span>
													</td>
													<td className="py-3 px-4">
														<span className="text-gray-400">
															{item.barcode || "—"}
														</span>
													</td>
													<td className="py-3 px-4 text-right whitespace-nowrap">
														<div className="flex justify-end gap-2">
															<button
																onClick={() => startEditing(item)}
																className="p-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded"
																title="Edit"
															>
																<Edit className="h-4 w-4" />
															</button>
															<button
																onClick={() => deleteItem(item.id, item.name)}
																className="p-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded"
																title="Delete"
															>
																<Trash2 className="h-4 w-4" />
															</button>
														</div>
													</td>
												</>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					<div className="mt-4 text-sm text-gray-400 text-right">
						{filteredItems.length}{" "}
						{filteredItems.length === 1 ? "item" : "items"} found
					</div>
				</div>
			</div>
		</div>
	);
};

export default Inventory;
