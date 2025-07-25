
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const limit = 6;

  useEffect(() => {
    const fetchLogs = async () => {
  setLoading(true);
  try {
    const res = await axios.get(`/api/admin/logs`, {
      withCredentials: true,
      params: { page, limit }
    });
    setLogs(res.data || []);
    setHasMore(res.data.length === limit);
  } catch (err) {
    console.error('Failed to fetch logs', err);
  } finally {
    setLoading(false);
  }
};

    fetchLogs();
  }, [page]);

  return (
    <div className="p-6 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold mb-4 text-center">System Activity Logs</h1>

        <div className="overflow-x-auto flex justify-center mb-4">
          <table className="border-collapse border border-gray-300 text-sm w-full max-w-4xl">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Time</th>
                <th className="p-2 border text-left">User ID</th>
                <th className="p-2 border text-left">Action</th>
                <th className="p-2 border text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2 border">{log.userId || 'Unknown'}</td>
                    <td className="p-2 border font-medium">{log.action}</td>
                    <td className="p-2 border text-xs">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center text-gray-700 font-medium">Page {page}</span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasMore}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
