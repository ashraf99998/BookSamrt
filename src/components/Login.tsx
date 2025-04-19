import React, { useEffect, useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const Login: React.FC = () => {
	const auth = getAuth();
	const provider = new GoogleAuthProvider();
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [authLoading, setAuthLoading] = useState(false);

	const handleLogin = async () => {
		if (authLoading) return;
		setAuthLoading(true);
		try {
			const result = await signInWithPopup(auth, provider);
			const user = result.user;

			const userRef = doc(db, "users", user.uid);
			const userSnap = await getDoc(userRef);

			if (!userSnap.exists()) {
				await setDoc(userRef, {
					name: user.displayName,
					email: user.email,
					role: "user",
				});
			}

			localStorage.setItem(
				"user",
				JSON.stringify({
					uid: user.uid,
					name: user.displayName,
					email: user.email,
				})
			);
			setCurrentUser(user);
			console.log("Login successful!");
		} catch (error: any) {
			console.error("Login error:", error);
			if (error.code === "auth/operation-not-allowed") {
				console.log("Google Sign-In is not enabled for this project.");
			} else {
				console.log("Login failed. Please try again.");
			}
		} finally {
			setAuthLoading(false);
		}
	};

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setCurrentUser(JSON.parse(storedUser));
		}
	}, []);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
			<div className="bg-gray-800 p-8 rounded-lg shadow-md text-center">
				{currentUser ? (
					<>
						<h1 className="text-2xl font-bold mb-4">
							Welcome, {currentUser.name}
						</h1>
						<p>{currentUser.email}</p>
					</>
				) : (
					<>
						<h1 className="text-2xl font-bold mb-6">Login</h1>
						<button
							onClick={handleLogin}
							disabled={authLoading}
							className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded text-white font-medium disabled:opacity-50"
						>
							{authLoading ? "Signing in..." : "Sign in with Google"}
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default Login;
