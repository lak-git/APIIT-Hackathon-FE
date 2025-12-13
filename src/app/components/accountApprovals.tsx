import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface AccountApproval {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  region: string;
}

interface AccountApprovalsProps {}

const MOCK_APPROVALS: AccountApproval[] = [
  {
    id: "1",
    fullName: "Ruwan Perera",
    email: "ruwan@disaster.gov.lk",
    phone: "+94 77 123 4567",
    organization: "Disaster Management Centre",
    designation: "Field Officer",
    region: "Ratnapura",
  },
  {
    id: "2",
    fullName: "Nadeesha Silva",
    email: "nadeesha@police.lk",
    phone: "+94 71 456 9874",
    organization: "Sri Lanka Police",
    designation: "Inspector",
    region: "Kalawana",
  },
];

export function AccountApprovals({}: AccountApprovalsProps) {
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
    <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-300 bg-black flex justify-between items-center">
        <div>
          <h3 className="text-white font-semibold text-sm">
            Pending Responder Account Approvals
          </h3>
          <p className="text-xs text-white mt-1">
            Review and approve verified responders before granting system access.
          </p>
        </div>
      </div>

      {/* Table wrapper */}
      <div
        className={[
          "overflow-x-auto overflow-y-hidden",
          "[&::-webkit-scrollbar]:h-2",
          "[&::-webkit-scrollbar-track]:bg-white",
          "[&::-webkit-scrollbar-thumb]:bg-gray-300",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-gray-400",
        ].join(" ")}
      >
        <table className="min-w-[1100px] w-full border-separate border-spacing-0">
          <thead className="bg-white sticky top-0 z-10 border-b border-gray-300">
            <tr>
              {[
                "Name",
                "Email",
                "Phone",
                "Organization",
                "Designation",
                "Region",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black whitespace-nowrap"
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
                className="border-t border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-black whitespace-nowrap">
                  {user.fullName}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {user.email}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {user.phone}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {user.organization}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {user.designation}
                </td>

                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {user.region}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-black text-white hover:bg-gray-900"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-black text-white hover:bg-gray-900"
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-300 bg-white">
          <span className="text-xs text-gray-600">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs font-semibold border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs font-semibold border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
