import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface AccountApproval {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  employeeId: string;
  designation: string;
  region: string;
}

const MOCK_APPROVALS: AccountApproval[] = [
  {
    id: "1",
    fullName: "Ruwan Perera",
    email: "ruwan@disaster.gov.lk",
    phone: "+94 77 123 4567",
    organization: "Disaster Management Centre",
    employeeId: "DMC-2387",
    designation: "Field Officer",
    region: "Ratnapura",
  },
  {
    id: "2",
    fullName: "Nadeesha Silva",
    email: "nadeesha@police.lk",
    phone: "+94 71 456 9874",
    organization: "Sri Lanka Police",
    employeeId: "SLP-7741",
    designation: "Inspector",
    region: "Kalawana",
  },
];

export function AccountApprovals() {
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setPage(1);
  }, []);

  const totalPages = Math.ceil(MOCK_APPROVALS.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const approvals = MOCK_APPROVALS.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-[#E5D5C3] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5D5C3] bg-[#FAF3E8]">
        <h3 className="text-[#800020] font-semibold text-sm">
          Pending Responder Account Approvals
        </h3>
        <p className="text-xs text-[#6B4423] mt-1">
          Review and approve verified responders before granting system access.
        </p>
      </div>

      {/* Table wrapper (horizontal scroll) */}
      <div
        className={[
          "overflow-x-auto",
          "overflow-y-hidden",
          // neat scrollbar
          "[&::-webkit-scrollbar]:h-2",
          "[&::-webkit-scrollbar-track]:bg-[#FAF3E8]",
          "[&::-webkit-scrollbar-thumb]:bg-[#D6C2AE]",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-[#C4AE98]",
        ].join(" ")}
      >
        <table className="min-w-[1200px] w-full border-separate border-spacing-0">
          <thead className="bg-[#F0E6D8] sticky top-0 z-10">
            <tr>
              {[
                "Name",
                "Email",
                "Phone",
                "Organization",
                "Employee ID",
                "Designation",
                "Region",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#4A1A1A] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {approvals.map((user) => (
              <tr
                key={user.id}
                className="border-t border-[#E5D5C3] hover:bg-[#FAF3E8] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-[#4A1A1A] whitespace-nowrap">
                  {user.fullName}
                </td>

                <td className="px-4 py-3 text-sm text-[#6B4423] whitespace-nowrap">
                  {user.email}
                </td>

                <td className="px-4 py-3 text-sm text-[#6B4423] whitespace-nowrap">
                  {user.phone}
                </td>

                <td className="px-4 py-3 text-sm text-[#6B4423] whitespace-nowrap">
                  {user.organization}
                </td>

                <td className="px-4 py-3 text-sm font-mono text-[#4A1A1A] whitespace-nowrap">
                  {user.employeeId}
                </td>

                <td className="px-4 py-3 text-sm text-[#6B4423] whitespace-nowrap">
                  {user.designation}
                </td>

                <td className="px-4 py-3 text-sm text-[#6B4423] whitespace-nowrap">
                  {user.region}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#166534] text-white hover:bg-[#14532D]"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#8B1E2D] text-white hover:bg-[#6B1B2B]"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {MOCK_APPROVALS.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#E5D5C3] bg-white">
          <span className="text-xs text-[#6B4423]">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs font-semibold border border-[#E5D5C3] rounded-md hover:bg-[#FAF3E8] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs font-semibold border border-[#E5D5C3] rounded-md hover:bg-[#FAF3E8] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
