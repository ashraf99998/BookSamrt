"use client";

import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";

const Navbar: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const toggleSearch = () => setIsSearchOpen(!isSearchOpen);

	return (
		<nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
			<div className="container mx-auto">
				<div className="flex justify-between items-center">
					<h1 className="text-xl font-bold">
						<Link to="/" className="flex items-center gap-2">
							Store Dashboard
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
									to="/requests"
									className="hover:text-green-400 transition-colors"
								>
									Requested Items
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
									to="/summary"
									className="hover:text-green-400 transition-colors"
								>
									Summary
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
					</div>

					{/* Mobile Navigation Controls */}
					<div className="flex items-center gap-2 md:hidden">
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
									to="/requests"
									className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
									onClick={toggleMenu}
								>
									Requested Items
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
									to="/summary"
									className="block py-2 px-3 hover:bg-gray-700 rounded-md hover:text-green-400 transition-colors"
									onClick={toggleMenu}
								>
									Summary
								</Link>
							</li>
						</ul>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
