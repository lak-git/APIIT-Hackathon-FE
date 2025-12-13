import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

import { IncidentProvider } from "./providers/IncidentProvider";
import { AuthProvider } from "./providers/AuthProvider";


export default function App() {
	return (
		<AuthProvider>
			<IncidentProvider>
				<div className="min-h-screen bg-[#FFFFFF] text-[#4A1A1A]">

					<main className="mx-auto w-full max-w-6xl ">
						<Outlet />
					</main>
				</div>
				<Toaster position="top-center" richColors />
			</IncidentProvider>
		</AuthProvider>
	);
}
