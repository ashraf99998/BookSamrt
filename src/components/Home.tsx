"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import {
	HomeIcon,
	Package,
	DollarSign,
	Ticket,
	ClipboardList,
	BarChart3,
	Clock,
	TrendingUp,
	ShoppingCart,
	Settings,
	ArrowRight,
	Loader2,
} from "lucide-react";

interface QuickStat {
	title: string;
	value: string | number;
	change?: number;
	icon: React.ReactNode;
	color: string;
}

interface RecentActivity {
	id: string;
	type: string;
	title: string;
	timestamp: Date;
	details?: string;
}

const Home: React.FC = () => {
	const [stats, setStats] = useState<QuickStat[]>([]);
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				// Fetch inventory count
				const inventorySnapshot = await getDocs(collection(db, "inventory"));
				const inventoryCount = inventorySnapshot.size;

				// Fetch recent sales data
				const salesQuery = query(
					collection(db, "sales"),
					orderBy("timestamp", "desc"),
					limit(1)
				);
				const salesSnapshot = await getDocs(salesQuery);
				let totalSales = 0;
				if (!salesSnapshot.empty) {
					totalSales = salesSnapshot.docs[0].data().totalSales || 0;
				}

				// Fetch scratch-off data
				const scratchoffQuery = query(
					collection(db, "scratchoffs"),
					orderBy("date", "desc"),
					limit(1)
				);
				const scratchoffSnapshot = await getDocs(scratchoffQuery);
				let scratchoffSales = 0;
				if (!scratchoffSnapshot.empty) {
					scratchoffSales = scratchoffSnapshot.docs[0].data().grandTotal || 0;
				}

				// Fetch customer requests
				const requestsSnapshot = await getDocs(
					collection(db, "customerRequests")
				);
				const pendingRequests = requestsSnapshot.docs.filter(
					(doc) => doc.data().status !== "completed"
				).length;

				// Set quick stats
				setStats([
					{
						title: "Total Inventory",
						value: inventoryCount,
						icon: <Package className="h-5 w-5" />,
						color: "bg-blue-500/20 text-blue-400",
					},
					{
						title: "Latest Sales",
						value: `$${totalSales.toFixed(2)}`,
						change: 3.2,
						icon: <DollarSign className="h-5 w-5" />,
						color: "bg-green-500/20 text-green-400",
					},
					{
						title: "Scratch-Off Sales",
						value: `$${scratchoffSales.toFixed(2)}`,
						icon: <Ticket className="h-5 w-5" />,
						color: "bg-purple-500/20 text-purple-400",
					},
					{
						title: "Pending Requests",
						value: pendingRequests,
						icon: <ClipboardList className="h-5 w-5" />,
						color: "bg-amber-500/20 text-amber-400",
					},
				]);

				// Fetch recent activity
				const activities: RecentActivity[] = [];

				// Get recent sales
				const recentSalesQuery = query(
					collection(db, "sales"),
					orderBy("timestamp", "desc"),
					limit(3)
				);
				const recentSalesSnapshot = await getDocs(recentSalesQuery);
				recentSalesSnapshot.forEach((doc) => {
					const data = doc.data();
					activities.push({
						id: doc.id,
						type: "sale",
						title: "Daily Sales Recorded",
						timestamp: data.timestamp?.toDate() || new Date(),
						details: `$${data.totalSales?.toFixed(2) || "0.00"}`,
					});
				});

				// Get recent inventory changes
				const recentInventoryQuery = query(
					collection(db, "inventory"),
					orderBy("updatedAt", "desc"),
					limit(3)
				);
				const recentInventorySnapshot = await getDocs(recentInventoryQuery);
				recentInventorySnapshot.forEach((doc) => {
					const data = doc.data();
					activities.push({
						id: doc.id,
						type: "inventory",
						title: `Inventory: ${data.name}`,
						timestamp: data.updatedAt?.toDate() || new Date(),
						details: `Stock: ${data.stock}, Price: $${
							data.price?.toFixed(2) || "0.00"
						}`,
					});
				});

				// Get recent customer requests
				const recentRequestsQuery = query(
					collection(db, "customerRequests"),
					orderBy("createdAt", "desc"),
					limit(3)
				);
				const recentRequestsSnapshot = await getDocs(recentRequestsQuery);
				recentRequestsSnapshot.forEach((doc) => {
					const data = doc.data();
					activities.push({
						id: doc.id,
						type: "request",
						title: `Request: ${data.text}`,
						timestamp: data.createdAt?.toDate() || new Date(),
						details: `Status: ${data.status || "pending"}`,
					});
				});

				// Sort all activities by timestamp
				activities.sort(
					(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
				);
				setRecentActivity(activities.slice(0, 5));
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "sale":
				return <DollarSign className="h-4 w-4 text-green-400" />;
			case "inventory":
				return <Package className="h-4 w-4 text-blue-400" />;
			case "request":
				return <ClipboardList className="h-4 w-4 text-amber-400" />;
			default:
				return <Clock className="h-4 w-4 text-gray-400" />;
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				<header className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<HomeIcon className="h-8 w-8 text-green-400" />
						<h1 className="text-2xl md:text-3xl font-bold">Store Dashboard</h1>
					</div>
					<p className="text-gray-400">
						Track inventory, sales, and store activity in one place.
					</p>
				</header>

				{loading ? (
					<div className="flex justify-center items-center py-12">
						<Loader2 className="h-8 w-8 text-green-400 animate-spin" />
						<span className="ml-2 text-gray-400">
							Loading dashboard data...
						</span>
					</div>
				) : (
					<>
						{/* Quick Stats */}
						<section className="mb-8">
							<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
								<TrendingUp className="h-5 w-5 text-green-400" />
								Quick Stats
							</h2>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{stats.map((stat, index) => (
									<div
										key={index}
										className="bg-gray-800 rounded-lg p-4 shadow-lg"
									>
										<div className="flex justify-between items-start">
											<div>
												<p className="text-gray-400 text-sm">{stat.title}</p>
												<p className="text-2xl font-bold mt-1">{stat.value}</p>
											</div>
											<div className={`p-2 rounded-full ${stat.color}`}>
												{stat.icon}
											</div>
										</div>
										{stat.change !== undefined && (
											<div className="mt-2">
												<span
													className={`text-sm ${
														stat.change >= 0 ? "text-green-400" : "text-red-400"
													}`}
												>
													{stat.change >= 0 ? "↑ " : "↓ "}
													{Math.abs(stat.change)}% from yesterday
												</span>
											</div>
										)}
									</div>
								))}
							</div>
						</section>

						<div className="grid gap-6 lg:grid-cols-3">
							{/* Navigation Cards */}
							<section className="lg:col-span-2">
								<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
									<ShoppingCart className="h-5 w-5 text-green-400" />
									Store Management
								</h2>
								<div className="grid gap-4 sm:grid-cols-2">
									<Link
										to="/inventory"
										className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex items-start gap-3"
									>
										<div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
											<Package className="h-5 w-5" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">Inventory</h3>
											<p className="text-sm text-gray-400">
												Add, edit, and track items in your store.
											</p>
										</div>
									</Link>

									<Link
										to="/sales"
										className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex items-start gap-3"
									>
										<div className="p-2 rounded-full bg-green-500/20 text-green-400">
											<DollarSign className="h-5 w-5" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">Sales</h3>
											<p className="text-sm text-gray-400">
												Record daily sales and view reports.
											</p>
										</div>
									</Link>

									<Link
										to="/scratchoff"
										className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex items-start gap-3"
									>
										<div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
											<Ticket className="h-5 w-5" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">
												Scratch-Off Tracker
											</h3>
											<p className="text-sm text-gray-400">
												Track scratch-offs and lottery activity.
											</p>
										</div>
									</Link>

									<Link
										to="/requests"
										className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex items-start gap-3"
									>
										<div className="p-2 rounded-full bg-amber-500/20 text-amber-400">
											<ClipboardList className="h-5 w-5" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">Customer Requests</h3>
											<p className="text-sm text-gray-400">
												Manage customer product requests.
											</p>
										</div>
									</Link>

									<Link
										to="/summary"
										className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex items-start gap-3"
									>
										<div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400">
											<BarChart3 className="h-5 w-5" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">Summary Dashboard</h3>
											<p className="text-sm text-gray-400">
												View analytics and performance reports.
											</p>
										</div>
									</Link>

									<div className="bg-gray-800 rounded-lg p-4 flex items-start gap-3 opacity-60">
										<div className="p-2 rounded-full bg-gray-500/20 text-gray-400">
											<Settings className="h-5 w-5" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">Settings</h3>
											<p className="text-sm text-gray-400">
												Configure store preferences and users.
											</p>
										</div>
									</div>
								</div>
							</section>

							{/* Recent Activity */}
							<section className="lg:col-span-1">
								<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
									<Clock className="h-5 w-5 text-green-400" />
									Recent Activity
								</h2>
								<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
									{recentActivity.length === 0 ? (
										<div className="text-center py-8 text-gray-400">
											<Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
											<p>No recent activity found</p>
										</div>
									) : (
										<ul className="space-y-4">
											{recentActivity.map((activity) => (
												<li
													key={activity.id}
													className="border-b border-gray-700 pb-3 last:border-0 last:pb-0"
												>
													<div className="flex items-start gap-3">
														<div className="p-2 rounded-full bg-gray-700 mt-1">
															{getActivityIcon(activity.type)}
														</div>
														<div>
															<p className="font-medium">{activity.title}</p>
															<p className="text-sm text-gray-400">
																{activity.details}
															</p>
															<p className="text-xs text-gray-500 mt-1">
																{formatDate(activity.timestamp)}
															</p>
														</div>
													</div>
												</li>
											))}
										</ul>
									)}
									<div className="mt-4 pt-3 border-t border-gray-700">
										<Link
											to="/summary"
											className="text-green-400 hover:text-green-300 text-sm flex items-center justify-center gap-1"
										>
											View All Activity
											<ArrowRight className="h-3 w-3" />
										</Link>
									</div>
								</div>
							</section>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Home;
