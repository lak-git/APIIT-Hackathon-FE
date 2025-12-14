import { useEffect, useState, useCallback } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../providers/AuthProvider";

interface PendingUser {
  id: string;
  full_name: string;
  phone: string;
  designation: string;
  region: string;
}

export function AccountApprovals() {
  const { session } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchPendingUsers = useCallback(async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user_profiles where verification_status = 'pending'
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, designation, region')
        .eq('verification_status', 'pending')
        .eq('is_admin', false);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setPendingUsers([]);
        setIsLoading(false);
        return;
      }

      // Fetch emails from auth.users via admin API or just show what we have
      // Note: In a real app, you'd need to either:
      // 1. Store email in user_profiles during signup
      // 2. Use a server function to get emails
      // For now, we'll show the data we have
      const usersWithEmail: PendingUser[] = profiles.map(p => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        phone: p.phone || '',
        designation: p.designation || '',
        region: p.region || '',
      }));

      setPendingUsers(usersWithEmail);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pending users');
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ verification_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      // Remove from local state
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Failed to approve user');
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This will delete their account.')) {
      return;
    }

    try {
      // Delete the profile (the auth user will remain but can't log in without a profile)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Remove from local state
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert('Failed to reject user');
    }
  };

  const totalPages = Math.ceil(pendingUsers.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const displayedUsers = pendingUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
        <button
          onClick={fetchPendingUsers}
          disabled={isLoading}
          className="p-2 text-white hover:bg-gray-800 rounded-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {error && (
        <div className="p-4 text-red-500 text-sm bg-red-50">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          Loading pending approvals...
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No pending approvals at this time.
        </div>
      ) : (
        <>
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
            <table className="min-w-[900px] w-full border-separate border-spacing-0">
              <thead className="bg-white sticky top-0 z-10 border-b border-gray-300">
                <tr>
                  {[
                    "Name",
                    "Phone",
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
                {displayedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-black whitespace-nowrap">
                      {user.full_name}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {user.phone}
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
                          onClick={() => handleApprove(user.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(user.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700"
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
          {pendingUsers.length > ITEMS_PER_PAGE && (
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
        </>
      )}
    </div>
  );
}
