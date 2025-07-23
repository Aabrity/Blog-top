import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/admin/logs', {
          withCredentials: true, // important for cookies
        });
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch logs', err);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">System Activity Logs</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Time</th>
              <th className="p-2 border">User ID</th>
              <th className="p-2 border">Action</th>
              <th className="p-2 border">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  No logs found
                </td>
              </tr>
            )}
            {logs.map((log, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-2 border text-sm">{log.userId || 'Unknown'}</td>
                <td className="p-2 border text-sm font-medium">{log.action}</td>
                <td className="p-2 border text-xs break-words">
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
