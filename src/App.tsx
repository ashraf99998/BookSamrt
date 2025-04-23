import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Inventory from "./components/Inventory";
import Sales from "./components/Sales";
import TrackScratchOff from "./components/TrackScratchOff";
import Navbar from "./components/Navbar";
import Requests from "./components/CustomerRequest";
import Summary from "./components/Summary";
import Users from "./components/Users";
import GasRecord from "./components/GasRecord";

function App() {
	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/inventory" element={<Inventory />} />
				<Route path="/sales" element={<Sales />} />
				<Route path="/scratchoff" element={<TrackScratchOff />} />
				<Route path="/requests" element={<Requests />} />
				<Route path="/summary" element={<Summary />} />
				<Route path="/users" element={<Users />} />
				<Route path="/gas" element={<GasRecord />} />
			</Routes>
		</>
	);
}

export default App;
