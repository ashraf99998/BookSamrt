"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, X, User, LogOut } from "lucide-react";
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const Navbar: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
	const toggleProfileMenu = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent event bubbling
		setIsProfileMenuOpen(!isProfileMenuOpen);
	};

	// Close profile menu when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			if (isProfileMenuOpen) {
				setIsProfileMenuOpen(false);
			}
		};

		// Add the event listener only when the menu is open
		if (isProfileMenuOpen) {
			document.addEventListener("click", handleClickOutside);
		}

		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [isProfileMenuOpen]);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setCurrentUser(JSON.parse(storedUser));
		}
	}, []);

	const auth = getAuth();
	const provider = new GoogleAuthProvider();
	const handleLogin = async () => {
		try {
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			const db = getFirestore();
			const userRef = doc(db, "users", user.uid);
			const userSnap = await getDoc(userRef);

			let userData;

			if (!userSnap.exists()) {
				userData = {
					name: user.displayName,
					email: user.email,
					photoURL: user.photoURL,
					uid: user.uid,
					role: "user",
					createdAt: new Date(),
					lastLogin: new Date(),
				};
				await setDoc(userRef, userData);
			} else {
				const userDoc = userSnap.data();
				userData = {
					name: userDoc.name || user.displayName,
					email: userDoc.email || user.email,
					photoURL: userDoc.photoURL || user.photoURL,
					uid: user.uid,
					role: userDoc.role || "user",
					lastLogin: new Date(),
				};
				// Update last login time
				await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
			}

			localStorage.setItem("user", JSON.stringify(userData));
			setCurrentUser(userData);
			window.location.reload();
		} catch (error) {
			console.error("Login failed", error);
		}
	};

	const handleLogout = async (e: React.MouseEvent) => {
		e.stopPropagation(); // Stop event propagation
		e.preventDefault(); // Prevent default behavior

		if (isLoggingOut) return; // Prevent multiple clicks

		try {
			setIsLoggingOut(true);
			await signOut(auth);
			localStorage.removeItem("user");
			setCurrentUser(null);
			window.location.reload();
			setIsProfileMenuOpen(false);
			setIsMenuOpen(false);
		} catch (error) {
			console.error("Logout failed", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	// Prevent profile menu from closing when clicking inside it
	const handleProfileMenuClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	return (
		<nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
			<div className="container mx-auto">
				<div className="flex justify-between items-center">
					<h1 className="text-xl font-bold">
						<Link to="/" className="flex items-center gap-2">
							RichWood Minimart
						</Link>
					</h1>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-4">
						<ul className="flex gap-6 text-sm font-medium">
							<li>
								<Link
									to="/inventory"
									className="hover:text-green-400 transition-colors"
								>
									Inventory
								</Link>
							</li>
							{currentUser?.role === "admin" && (
								<>
									<li>
										<Link
											to="/sales"
											className="hover:text-green-400 transition-colors"
										>
											Sales
										</Link>
									</li>
									<li>
										<Link
											to="/summary"
											className="hover:text-green-400 transition-colors"
										>
											Summary
										</Link>
									</li>
									<li>
										<Link
											to="/scratchoff"
											className="hover:text-green-400 transition-colors"
										>
											Scratch-Off
										</Link>
									</li>
									<li>
										<Link
											to="/gas"
											className="hover:text-green-400 transition-colors"
										>
											Gas
										</Link>
									</li>
									<li>
										<Link
											to="/users"
											className="hover:text-green-400 transition-colors"
										>
											Users
										</Link>
									</li>
								</>
							)}
							<li>
								<Link
									to="/requests"
									className="hover:text-green-400 transition-colors"
								>
									Requested Items
								</Link>
							</li>
						</ul>
						<div className="relative">
							<input
								type="text"
								placeholder="Search..."
								className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-40"
							/>
							<Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						</div>
						{currentUser ? (
							<div className="relative ml-4">
								{currentUser.photoURL ? (
									<img
										src={currentUser.photoURL || "/placeholder.svg"}
										alt="User"
										className="w-8 h-8 rounded-full cursor-pointer"
										title="User Menu"
										onClick={toggleProfileMenu}
									/>
								) : (
									<div
										className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center cursor-pointer"
										onClick={toggleProfileMenu}
									>
										<User className="h-5 w-5" />
									</div>
								)}
								{isProfileMenuOpen && (
									<div
										onClick={handleProfileMenuClick}
										className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 text-white rounded shadow-lg z-50 p-4 text-sm"
									>
										<div className="font-semibold">{currentUser.name}</div>
										<div className="text-xs text-gray-400">
											{currentUser.email}
										</div>
										<div className="text-xs text-gray-500 italic mt-1">
											Role: {currentUser.role}
										</div>
										<hr className="my-2 border-gray-700" />
										<button
											onClick={handleLogout}
											disabled={isLoggingOut}
											className="text-left text-red-400 w-full hover:text-red-300 hover:underline flex items-center gap-2 disabled:opacity-50"
										>
											<LogOut className="h-4 w-4" />
											{isLoggingOut ? "Logging out..." : "Logout"}
										</button>
									</div>
								)}
							</div>
						) : (
							<button
								onClick={handleLogin}
								className="ml-4 px-3 py-1 text-sm bg-green-600 hover:bg-green-500 rounded"
							>
								Login
							</button>
						)}
					</div>

					{/* Mobile Navigation Controls */}
					<div className="flex items-center gap-2 md:hidden">
						{currentUser && (
							<div className="relative">
								{currentUser.photoURL ? (
									<img
										src={currentUser.photoURL || "/placeholder.svg"}
										alt="User"
										className="w-8 h-8 rounded-full cursor-pointer"
										onClick={toggleProfileMenu}
									/>
								) : (
									<div
										className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center cursor-pointer"
										onClick={toggleProfileMenu}
									>
										<User className="h-5 w-5" />
									</div>
								)}
								{isProfileMenuOpen && (
									<div
										onClick={handleProfileMenuClick}
										className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 text-white rounded shadow-lg z-50 p-4 text-sm"
									>
										<div className="font-semibold">{currentUser.name}</div>
										<div className="text-xs text-gray-400">
											{currentUser.email}
										</div>
										<div className="text-xs text-gray-500 italic mt-1">
											Role: {currentUser.role}
										</div>
										<hr className="my-2 border-gray-700" />
										<button
											onClick={handleLogout}
											disabled={isLoggingOut}
											className="text-left text-red-400 w-full hover:text-red-300 hover:underline flex items-center gap-2 disabled:opacity-50"
										>
											<LogOut className="h-4 w-4" />
											{isLoggingOut ? "Logging out..." : "Logout"}
										</button>
									</div>
								)}
							</div>
						)}
						<button
							onClick={toggleSearch}
							className="p-2 rounded-full hover:bg-gray-800"
							aria-label="Search"
						>
							<Search className="h-5 w-5" />
						</button>
						<button
							onClick={toggleMenu}
							className="p-2 rounded-full hover:bg-gray-800"
							aria-label="Menu"
						>
							{isMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Search Bar */}
				{isSearchOpen && (
					<div className="mt-3 md:hidden">
						<div className="relative">
							<input
								type="text"
								placeholder="Search..."
								className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
								autoFocus
							/>
							<button
								className="absolute right-2 top-1/2 transform -translate-y-1/2"
								onClick={toggleSearch}
							>
								<X className="h-4 w-4 text-gray-400" />
							</button>
						</div>
					</div>
				)}

				{/* Mobile Menu */}
				{isMenuOpen && (
					<div className="mt-3 md:hidden">
						<ul className="flex flex-col gap-3 bg-gray-800 rounded-lg p-4 text-sm font-medium">
							<li>
								<Link
									to="/inventory"
									className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
									onClick={toggleMenu}
								>
									Inventory
								</Link>
							</li>
							{currentUser?.role === "admin" && (
								<>
									<li>
										<Link
											to="/sales"
											className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
											onClick={toggleMenu}
										>
											Sales
										</Link>
									</li>
									<li>
										<Link
											to="/summary"
											className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
											onClick={toggleMenu}
										>
											Summary
										</Link>
									</li>
									<li>
										<Link
											to="/scratchoff"
											className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
											onClick={toggleMenu}
										>
											Scratch-Off
										</Link>
									</li>
									<li>
										<Link
											to="/gas"
											className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
											onClick={toggleMenu}
										>
											Gas
										</Link>
									</li>
									<li>
										<Link
											to="/users"
											className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
											onClick={toggleMenu}
										>
											Users
										</Link>
									</li>
								</>
							)}
							<li>
								<Link
									to="/requests"
									className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
									onClick={toggleMenu}
								>
									Requested Items
								</Link>
							</li>
							{!currentUser && (
								<li>
									<button
										onClick={() => {
											handleLogin();
											toggleMenu();
										}}
										className="w-full text-left py-2 px-3 bg-green-600 hover:bg-green-500 rounded-md transition-colors"
									>
										Login
									</button>
								</li>
							)}
						</ul>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
