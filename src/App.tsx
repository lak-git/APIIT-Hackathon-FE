import { NavLink, Outlet } from "react-router-dom";
import { Toaster } from "sonner";

import { IncidentProvider } from "./providers/IncidentProvider";

const baseLinkClasses =
	"px-3 py-2 rounded-md text-sm font-medium transition-colors";

export default function App() {
	return (
		<IncidentProvider>
			<div className="min-h-screen bg-[#FAF3E8] text-[#4A1A1A]">
				<header className="border-b border-[#E5D5C3] bg-white/90 backdrop-blur-sm">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-[#800020]/80">
								APIIT Emergency Ops
							</p>
							<h1 className="text-2xl font-semibold text-[#4A1A1A]">
								Response Control Center
							</h1>
						</div>
						<nav className="flex gap-2">
							<NavLink
								to="/emergency"
								className={({ isActive }) =>
									`${baseLinkClasses} ${isActive ? "bg-[#800020] text-white" : "text-[#800020] hover:bg-[#F0E6D8]"}`
								}
							>
								Emergency Response System
							</NavLink>
							<NavLink
								to="/command"
								className={({ isActive }) =>
									`${baseLinkClasses} ${isActive ? "bg-[#800020] text-white" : "text-[#800020] hover:bg-[#F0E6D8]"}`
								}
							>
								Command Dashboard
							</NavLink>
						</nav>
					</div>
				</header>

				<main className="mx-auto w-full max-w-6xl px-4 py-6">
					<Outlet />
				</main>
			</div>
			<Toaster position="top-center" richColors />
		</IncidentProvider>
	);
}
