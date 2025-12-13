import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { LoginScreen } from "./app/components/LoginScreen";

import { IncidentProvider } from "./providers/IncidentProvider";


export default function App() {
	return (
		<LoginScreen onLogin={(email, password) => { }} />
		// <IncidentProvider>
		// 	<div className="min-h-screen bg-[#FAF3E8] text-[#4A1A1A]">

		// 		<main className="mx-auto w-full max-w-6xl px-4 py-6">
		// 			<Outlet />
		// 		</main>
		// 	</div>
		// 	<Toaster position="top-center" richColors />
		// </IncidentProvider>
	);
}
