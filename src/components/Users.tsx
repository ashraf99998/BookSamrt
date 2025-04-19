"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	query,
	orderBy,
} from "firebase/firestore";
import {
	UsersIcon,
	Shield,
	User,
	Edit,
	Save,
	X,
	Loader2,
	AlertCircle,
	CheckCircle2,
	Search,
	UserCog,
	ShieldAlert,
	MoreHorizontal,
	Trash2,
	Mail,
	Calendar,
} from "lucide-react";

interface UserData {
	id: string;
	uid: string;
	name: string;
	email: string;
	role: string;
	photoURL?: string;
	lastLogin?: Date;
	createdAt?: Date;
	phone?: string;
	status?: "active" | "inactive" | "suspended";
}

const Users: React.FC = () => {
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [users, setUsers] = useState<UserData[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingUser, setEditingUser] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [notification, setNotification] = useState<{
		show: boolean;
		message: string;
		type: "success" | "error";
	}>({ show: false, message: "", type: "success" });
	const [editData, setEditData] = useState<{
		role: string;
		status: "active" | "inactive" | "suspended";
	}>({
		role: "user",
		status: "active",
	});

	// First, get the current user from localStorage
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			try {
				const parsedUser = JSON.parse(storedUser);
				setCurrentUser(parsedUser);
			} catch (err) {
				console.error("Error parsing user from localStorage:", err);
				setError("Failed to load user data");
				setLoading(false);
			}
		} else {
			// No user in localStorage
			setLoading(false);
		}
	}, []);

	// Then, check if the user is admin and load users if they are
	useEffect(() => {
		const fetchUsers = async () => {
			if (!currentUser?.uid) return;

			try {
				// Check if user is admin directly from their stored data
				if (currentUser.role === "admin") {
					setIsAdmin(true);

					// Fetch all users
					const q = query(collection(db, "users"), orderBy("name"));
					const snapshot = await getDocs(q);
					const userData = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
						lastLogin: doc.data().lastLogin?.toDate(),
						createdAt: doc.data().createdAt?.toDate(),
					})) as UserData[];

					setUsers(userData);
					setFilteredUsers(userData);
				} else {
					setIsAdmin(false);
				}
			} catch (error) {
				console.error("Error fetching users:", error);
				setError("Failed to load user data");
				showNotification("Failed to load user data", "error");
			} finally {
				setLoading(false);
			}
		};

		if (currentUser) {
			fetchUsers();
		}
	}, [currentUser]);

	useEffect(() => {
		const filtered = users.filter((user) => {
			const matchesSearch =
				user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email?.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesRole = roleFilter === "all" || user.role === roleFilter;

			return matchesSearch && matchesRole;
		});

		setFilteredUsers(filtered);
	}, [searchTerm, roleFilter, users]);

	const handleEditUser = (user: UserData) => {
		setEditingUser(user.uid);
		setEditData({
			role: user.role || "user",
			status: user.status || "active",
		});
	};

	const handleSaveUser = async (user: UserData) => {
		try {
			const userRef = doc(db, "users", user.id);
			await updateDoc(userRef, {
				role: editData.role,
				status: editData.status,
				updatedAt: new Date(),
			});

			// Update local state
			setUsers((prevUsers) =>
				prevUsers.map((u) =>
					u.uid === user.uid
						? {
								...u,
								role: editData.role,
								status: editData.status,
						  }
						: u
				)
			);

			setEditingUser(null);
			showNotification(
				`User ${user.name}'s role updated to ${editData.role}`,
				"success"
			);
		} catch (error) {
			console.error("Error updating user:", error);
			showNotification("Failed to update user", "error");
		}
	};

	const cancelEdit = () => {
		setEditingUser(null);
	};

	const showNotification = (message: string, type: "success" | "error") => {
		setNotification({ show: true, message, type });
		setTimeout(() => {
			setNotification({ show: false, message: "", type: "success" });
		}, 3000);
	};

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-900/30 text-red-300";
			default:
				return "bg-blue-900/30 text-blue-300";
		}
	};

	const getRoleIcon = (role: string) => {
		switch (role) {
			case "admin":
				return <ShieldAlert className="h-3.5 w-3.5 mr-1" />;
			default:
				return <User className="h-3.5 w-3.5 mr-1" />;
		}
	};

	const getStatusBadgeColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-900/30 text-green-300";
			case "inactive":
				return "bg-gray-900/30 text-gray-300";
			case "suspended":
				return "bg-red-900/30 text-red-300";
			default:
				return "bg-gray-900/30 text-gray-300";
		}
	};

	const formatDate = (date?: Date) => {
		if (!date) return "N/A";
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date);
	};

	if (!isAdmin && !loading) {
		return (
			<div className="min-h-screen flex items-center justify-center text-center text-white bg-gray-900 p-4">
				<div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
					<ShieldAlert className="h-16 w-16 text-red-400 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-red-400 mb-2">
						Access Denied
					</h2>
					<p className="text-gray-300 mb-4">
						You do not have permission to view this page.
					</p>
					<p className="text-gray-400 text-sm">
						Please contact an administrator if you believe this is an error.
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center text-center text-white bg-gray-900 p-4">
				<div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
					<AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
					<p className="text-gray-300 mb-4">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

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
						<UserCog className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
					</div>
				</div>

				{loading ? (
					<div className="flex justify-center items-center py-12">
						<Loader2 className="h-8 w-8 text-green-400 animate-spin" />
						<span className="ml-2 text-gray-400">Loading user data...</span>
					</div>
				) : (
					<>
						<div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
							<div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
								<h2 className="text-xl font-semibold flex items-center gap-2">
									<UsersIcon className="h-5 w-5 text-green-400" />
									User Directory
								</h2>

								<div className="flex flex-col sm:flex-row gap-3">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
										<input
											type="text"
											placeholder="Search users..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
										/>
									</div>

									<select
										value={roleFilter}
										onChange={(e) => setRoleFilter(e.target.value)}
										className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
									>
										<option value="all">All Roles</option>
										<option value="admin">Admin</option>
										<option value="user">User</option>
									</select>
								</div>
							</div>

							{filteredUsers.length === 0 ? (
								<div className="bg-gray-750 rounded-lg p-8 text-center">
									<UsersIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
									<h3 className="text-lg font-medium text-gray-300 mb-1">
										No users found
									</h3>
									<p className="text-gray-400">
										{searchTerm || roleFilter !== "all"
											? "Try adjusting your filters or search term"
											: "No users have been added to the system yet"}
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="text-left text-gray-400 border-b border-gray-700">
												<th className="py-3 px-4">User</th>
												<th className="py-3 px-4">Contact</th>
												<th className="py-3 px-4">Role</th>
												<th className="py-3 px-4">Status</th>
												<th className="py-3 px-4">Last Login</th>
												<th className="py-3 px-4 text-right">Actions</th>
											</tr>
										</thead>
										<tbody>
											{filteredUsers.map((user) => (
												<tr
													key={user.uid}
													className="border-b border-gray-800 hover:bg-gray-750"
												>
													<td className="py-3 px-4">
														<div className="flex items-center gap-3">
															<div className="h-10 w-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
																{user.photoURL ? (
																	<img
																		src={user.photoURL || "/placeholder.svg"}
																		alt={user.name}
																		className="h-full w-full object-cover"
																	/>
																) : (
																	<User className="h-6 w-6 text-gray-400" />
																)}
															</div>
															<div>
																<p className="font-medium">{user.name}</p>
																<p className="text-xs text-gray-400">
																	Joined: {formatDate(user.createdAt)}
																</p>
															</div>
														</div>
													</td>
													<td className="py-3 px-4">
														<div className="flex flex-col">
															<div className="flex items-center gap-1">
																<Mail className="h-3.5 w-3.5 text-gray-400" />
																<span className="text-gray-300">
																	{user.email}
																</span>
															</div>
															{user.phone && (
																<div className="flex items-center gap-1 mt-1">
																	<Phone className="h-3.5 w-3.5 text-gray-400" />
																	<span className="text-gray-300">
																		{user.phone}
																	</span>
																</div>
															)}
														</div>
													</td>
													<td className="py-3 px-4">
														{editingUser === user.uid ? (
															<select
																value={editData.role}
																onChange={(e) =>
																	setEditData({
																		...editData,
																		role: e.target.value,
																	})
																}
																className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
															>
																<option value="user">User</option>
																<option value="admin">Admin</option>
															</select>
														) : (
															<span
																className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
																	user.role
																)}`}
															>
																{getRoleIcon(user.role)}
																{user.role || "User"}
															</span>
														)}
													</td>
													<td className="py-3 px-4">
														{editingUser === user.uid ? (
															<select
																value={editData.status}
																onChange={(e) =>
																	setEditData({
																		...editData,
																		status: e.target.value as
																			| "active"
																			| "inactive"
																			| "suspended",
																	})
																}
																className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
															>
																<option value="active">Active</option>
																<option value="inactive">Inactive</option>
																<option value="suspended">Suspended</option>
															</select>
														) : (
															<span
																className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
																	user.status || "active"
																)}`}
															>
																{user.status || "Active"}
															</span>
														)}
													</td>
													<td className="py-3 px-4">
														<div className="flex items-center gap-1">
															<Calendar className="h-3.5 w-3.5 text-gray-400" />
															<span>{formatDate(user.lastLogin)}</span>
														</div>
													</td>
													<td className="py-3 px-4 text-right">
														{editingUser === user.uid ? (
															<div className="flex justify-end gap-2">
																<button
																	onClick={() => handleSaveUser(user)}
																	className="p-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded"
																	title="Save"
																>
																	<Save className="h-4 w-4" />
																</button>
																<button
																	onClick={cancelEdit}
																	className="p-1 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 rounded"
																	title="Cancel"
																>
																	<X className="h-4 w-4" />
																</button>
															</div>
														) : (
															<div className="flex justify-end gap-2">
																<button
																	onClick={() => handleEditUser(user)}
																	className="p-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded"
																	title="Edit User"
																>
																	<Edit className="h-4 w-4" />
																</button>
																<div className="relative group">
																	<button
																		className="p-1 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 rounded"
																		title="More Options"
																	>
																		<MoreHorizontal className="h-4 w-4" />
																	</button>
																	<div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 hidden group-hover:block">
																		<div className="py-1">
																			<button className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
																				<Mail className="h-4 w-4 mr-2" />
																				Send Email
																			</button>
																			<button className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
																				<Trash2 className="h-4 w-4 mr-2" />
																				Delete User
																			</button>
																		</div>
																	</div>
																</div>
															</div>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<Shield className="h-5 w-5 text-green-400" />
								Role Permissions
							</h2>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="bg-gray-750 p-4 rounded-lg">
									<div className="flex items-center gap-2 mb-3">
										<ShieldAlert className="h-5 w-5 text-red-400" />
										<h3 className="font-semibold">Admin</h3>
									</div>
									<ul className="space-y-2 text-sm">
										<li className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-400" />
											<span>Full system access</span>
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-400" />
											<span>Manage users and permissions</span>
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-400" />
											<span>Access to all reports and data</span>
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-400" />
											<span>System configuration</span>
										</li>
									</ul>
								</div>

								<div className="bg-gray-750 p-4 rounded-lg">
									<div className="flex items-center gap-2 mb-3">
										<User className="h-5 w-5 text-blue-400" />
										<h3 className="font-semibold">User</h3>
									</div>
									<ul className="space-y-2 text-sm">
										<li className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-400" />
											<span>Basic inventory view</span>
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-400" />
											<span>Record sales</span>
										</li>
										<li className="flex items-center gap-2">
											<X className="h-4 w-4 text-red-400" />
											<span>Limited report access</span>
										</li>
										<li className="flex items-center gap-2">
											<X className="h-4 w-4 text-red-400" />
											<span>No administrative functions</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

// This component is needed for the Phone icon
const Phone: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
	</svg>
);

export default Users;
