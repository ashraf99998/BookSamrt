"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { Save, DollarSign, Calculator, Calendar } from "lucide-react";

const Sales: React.FC = () => {
	const [shiftDate, setShiftDate] = useState(
		() => new Date().toISOString().split("T")[0]
	);
	const [coins, setCoins] = useState(0);
	const [cash, setCash] = useState(0);
	const [creditCards, setCreditCards] = useState(0);
	const [ebt, setEbt] = useState(0);
	const [onlineLotto, setOnlineLotto] = useState(0);
	const [instantLotto, setInstantLotto] = useState(0);
	const [payouts, setPayouts] = useState(0);
	const [expenses, setExpenses] = useState(0);
	const [z1Total, setZ1Total] = useState(0);
	const [outsideSales, setOutsideSales] = useState(0);
	const [tax1, setTax1] = useState(0);
	const [tax2, setTax2] = useState(0);

	const [insideSales, setInsideSales] = useState(0);
	const [totalSales, setTotalSales] = useState(0);
	const [difference, setDifference] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [notification, setNotification] = useState({
		show: false,
		message: "",
		type: "",
	});

	useEffect(() => {
		const inside = coins + cash + creditCards + ebt;
		setInsideSales(inside);

		const total =
			inside +
			onlineLotto +
			instantLotto -
			payouts -
			expenses +
			outsideSales +
			tax1 +
			tax2;
		setTotalSales(total);

		setDifference(total - z1Total);
	}, [
		coins,
		cash,
		creditCards,
		ebt,
		onlineLotto,
		instantLotto,
		payouts,
		expenses,
		outsideSales,
		tax1,
		tax2,
		z1Total,
	]);

	useEffect(() => {
		const unsubscribe = onSnapshot(collection(db, "sales"), (snapshot) => {
			const salesData = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			console.log("Live Sales Data:", salesData);
		});

		return () => unsubscribe();
	}, []);

	const handleInput =
		(setter: React.Dispatch<React.SetStateAction<number>>) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = Number.parseFloat(e.target.value);
			setter(isNaN(value) ? 0 : value);
		};

	const handleSubmit = async () => {
		setIsSubmitting(true);

		const shiftData = {
			shiftDate,
			coins,
			cash,
			creditCards,
			ebt,
			onlineLotto,
			instantLotto,
			payouts,
			expenses,
			z1Total,
			outsideSales,
			tax1,
			tax2,
			insideSales,
			totalSales,
			difference,
			timestamp: new Date(),
		};

		try {
			await addDoc(collection(db, "sales"), shiftData);
			setNotification({
				show: true,
				message: "Shift data saved successfully!",
				type: "success",
			});

			setTimeout(() => {
				setNotification({ show: false, message: "", type: "" });
			}, 3000);
		} catch (error) {
			console.error("Error saving shift data:", error);
			setNotification({
				show: true,
				message: "Failed to save shift data.",
				type: "error",
			});

			setTimeout(() => {
				setNotification({ show: false, message: "", type: "" });
			}, 3000);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
			{notification.show && (
				<div
					className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
						notification.type === "success" ? "bg-green-600" : "bg-red-600"
					}`}
				>
					{notification.message}
				</div>
			)}

			<div className="max-w-4xl mx-auto">
				<div className="flex items-center gap-3 mb-6">
					<DollarSign className="h-8 w-8 text-green-400" />
					<h1 className="text-2xl md:text-3xl font-bold">Daily Shift Log</h1>
				</div>

				<div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
					<div className="p-4 md:p-6 border-b border-gray-700">
						<div className="flex items-center gap-2 mb-4">
							<Calendar className="h-5 w-5 text-green-400" />
							<h2 className="text-lg md:text-xl font-semibold">
								Shift Data Entry
							</h2>
						</div>

						<div className="mb-6">
							<label
								className="block text-sm font-medium mb-1 text-white"
								htmlFor="shiftDate"
							>
								Shift Date
							</label>
							<input
								id="shiftDate"
								type="date"
								className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
								value={shiftDate}
								onChange={(e) => setShiftDate(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
							<InputField
								label="Coins"
								onChange={handleInput(setCoins)}
								icon="$"
							/>
							<InputField
								label="Cash"
								onChange={handleInput(setCash)}
								icon="$"
							/>
							<InputField
								label="Credit Cards"
								onChange={handleInput(setCreditCards)}
								icon="$"
							/>
							<InputField label="EBT" onChange={handleInput(setEbt)} icon="$" />
							<InputField
								label="Online Lotto Cashes"
								onChange={handleInput(setOnlineLotto)}
								icon="$"
							/>
							<InputField
								label="Instant Lotto Cashes"
								onChange={handleInput(setInstantLotto)}
								icon="$"
							/>
							<InputField
								label="Payouts"
								onChange={handleInput(setPayouts)}
								icon="$"
							/>
							<InputField
								label="Expenses"
								onChange={handleInput(setExpenses)}
								icon="$"
							/>
							<InputField
								label="Z1 Total"
								onChange={handleInput(setZ1Total)}
								icon="$"
							/>
							<InputField
								label="Outside Sales"
								onChange={handleInput(setOutsideSales)}
								icon="$"
							/>
							<InputField
								label="Tax 1"
								onChange={handleInput(setTax1)}
								icon="$"
							/>
							<InputField
								label="Tax 2"
								onChange={handleInput(setTax2)}
								icon="$"
							/>
						</div>
					</div>

					<div className="bg-gray-900 p-4 md:p-6">
						<div className="flex items-center gap-2 mb-4">
							<Calculator className="h-5 w-5 text-green-400" />
							<h3 className="text-lg font-semibold">Summary</h3>
						</div>

						<div className="bg-gray-800 p-4 rounded-lg mb-6 divide-y divide-gray-700">
							<SummaryItem label="Inside Sales" value={insideSales} />
							<SummaryItem label="Total Sales" value={totalSales} />
							<SummaryItem label="Z1 Total" value={z1Total} />
							<SummaryItem
								label="Difference"
								value={difference}
								className={difference >= 0 ? "text-green-400" : "text-red-400"}
							/>
						</div>

						<button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<>
									<span className="animate-pulse">Saving...</span>
								</>
							) : (
								<>
									<Save className="h-5 w-5" />
									Save Shift Data
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

interface InputFieldProps {
	label: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	icon?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, onChange, icon }) => {
	return (
		<div>
			<label className="block text-sm font-medium mb-1 text-white">
				{label}
			</label>
			<div className="relative">
				{icon && (
					<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
						{icon}
					</span>
				)}
				<input
					type="number"
					step="0.01"
					className={`w-full bg-gray-700 border border-gray-600 rounded-md ${
						icon ? "pl-7" : "pl-3"
					} pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
					onChange={onChange}
					placeholder="0.00"
				/>
			</div>
		</div>
	);
};

interface SummaryItemProps {
	label: string;
	value: number;
	className?: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
	label,
	value,
	className,
}) => {
	return (
		<div className="flex justify-between py-2">
			<span>{label}:</span>
			<strong className={className}>${value.toFixed(2)}</strong>
		</div>
	);
};

export default Sales;
