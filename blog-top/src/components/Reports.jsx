// import { Modal, Table, Button } from 'flowbite-react';
// import { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { HiOutlineExclamationCircle } from 'react-icons/hi';

// export default function DashReports() {
//   const { currentUser } = useSelector((state) => state.user);
//   const [reports, setReports] = useState([]);
//   const [showMore, setShowMore] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [reportIdToDelete, setReportIdToDelete] = useState('');

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const res = await fetch(`/api/auth/admin/reports`);
//         const data = await res.json();
//         if (res.ok) {
//           setReports(data);
//           if (data.length < 9) {
//             setShowMore(false);
//           }
//         }
//       } catch (error) {
//         //console.log(error.message);
//       }
//     };
//     if (currentUser?.isAdmin) {
//       fetchReports();
//     }
//   }, [currentUser?._id]);

//   const handleShowMore = async () => {
//     const startIndex = reports.length;
//     try {
//       const res = await fetch(
//         `/api/auth/admin/reports?startIndex=${startIndex}`
//       );
//       const data = await res.json();
//       if (res.ok) {
//         setReports((prev) => [...prev, ...data]);
//         if (data.length < 9) {
//           setShowMore(false);
//         }
//       }
//     } catch (error) {
//       //console.log(error.message);
//     }
//   };

//   const handleDeleteReport = async () => {
//     setShowModal(false);
//     try {
//       const res = await fetch(`/api/auth/admin/deleteWithPost/${reportIdToDelete}`, {
//         method: 'DELETE',
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setReports((prev) =>
//           prev.filter((report) => report._id !== reportIdToDelete)
//         );
//       } else {
//         //console.log(data.message);
//       }
//     } catch (error) {
//       //console.log(error.message);
//     }
//   };

//   return (
//     <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
//       {currentUser?.isAdmin && reports.length > 0 ? (
//         <>
//           <Table hoverable className="shadow-md">
//             <Table.Head>
//               <Table.HeadCell>Date Reported</Table.HeadCell>
//               <Table.HeadCell>Post Title</Table.HeadCell>
//               <Table.HeadCell>Reported By</Table.HeadCell>
//               <Table.HeadCell>Reason</Table.HeadCell>
//               <Table.HeadCell>Comment</Table.HeadCell>
//               <Table.HeadCell>Status</Table.HeadCell>
//               <Table.HeadCell>Delete</Table.HeadCell>
//             </Table.Head>
//             {reports.map((report) => (
//               <Table.Body className="divide-y" key={report._id}>
//                 <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
//                   <Table.Cell>
//                     {new Date(report.createdAt).toLocaleDateString()}
//                   </Table.Cell>
//                   <Table.Cell>
//                     {report.postId?.title || report.postId?._id}
//                   </Table.Cell>
//                   <Table.Cell>
//                     {report.reporterId?.username || report.reporterId?._id}
//                   </Table.Cell>
//                   <Table.Cell>{report.reason}</Table.Cell>
//                   <Table.Cell>{report.comment || '-'}</Table.Cell>
//                   <Table.Cell>{report.status}</Table.Cell>
//                   <Table.Cell>
//                     <span
//                       onClick={() => {
//                         setShowModal(true);
//                         setReportIdToDelete(report._id);
//                       }}
//                       className="font-medium text-green-500 hover:underline cursor-pointer"
//                     >
//                       Delete
//                     </span>
//                   </Table.Cell>
//                 </Table.Row>
//               </Table.Body>
//             ))}
//           </Table>

//           {showMore && (
//             <button
//               onClick={handleShowMore}
//               className="w-full text-teal-500 self-center text-sm py-7"
//             >
//               Show more
//             </button>
//           )}
//         </>
//       ) : (
//         <p>No reports found.</p>
//       )}

//       <Modal show={showModal} onClose={() => setShowModal(false)} popup size="md">
//         <Modal.Header />
//         <Modal.Body>
//           <div className="text-center">
//             <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
//             <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">
//               Are you sure you want to delete this report and its related post?
//             </h3>
//             <div className="flex justify-center gap-4">
//               <Button color="success" onClick={handleDeleteReport}>
//                 Yes, delete both
//               </Button>
//               <Button color="gray" onClick={() => setShowModal(false)}>
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         </Modal.Body>
//       </Modal>
//     </div>
//   );
// }
import { Button, Modal, Table } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useSelector } from 'react-redux';

export default function DashReports() {
  const { currentUser } = useSelector((state) => state.user);
  const [reports, setReports] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reportIdToDelete, setReportIdToDelete] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF Token on mount
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const res = await fetch('/api/csrf-token', {
          credentials: 'include',
        });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error('Error fetching CSRF token:', err);
      }
    };
    fetchCSRFToken();
  }, []);

  // Fetch reports
  // useEffect(() => {
  //   const fetchReports = async () => {
  //     try {
  //       const res = await fetch(`/api/admin/reports`, {  headers: { "CSRF-Token": csrfToken },
  //       credentials: "include",});
  //       const data = await res.json();
  //       if (res.ok) {
  //         setReports(data);
  //         if (data.length < 9) {
  //           setShowMore(false);
  //         }
  //       }
  //     } catch (error) {
  //       //console.log(error.message);
  //     }
  //   };
  //   if (currentUser?.isAdmin) {
  //     fetchReports();
  //   }
  // }, [currentUser?._id]);
useEffect(() => {
  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/admin/reports`, {
        headers: { "CSRF-Token": csrfToken },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports);
        if (data.reports.length < 9) {
          setShowMore(false);
        }
      }
    } catch (error) {
      //console.log(error.message);
    }
  };

  if (currentUser?.isAdmin && csrfToken) {
    fetchReports();
  }
}, [currentUser?.isAdmin, csrfToken]);

  const handleShowMore = async () => {
    const startIndex = reports.length;
    try {
      const res = await fetch(
        `/api/auth/admin/reports?startIndex=${startIndex}`
      );
      const data = await res.json();
      if (res.ok) {
        setReports((prev) => [...prev, ...data]);
        if (data.length < 9) {
          setShowMore(false);
        }
      }
    } catch (error) {
      //console.log(error.message);
    }
  };

  const handleDeleteReport = async () => {
    setShowModal(false);
    try {
      const res = await fetch(`/api/auth/admin/deleteWithPost/${reportIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setReports((prev) =>
          prev.filter((report) => report._id !== reportIdToDelete)
        );
      } else {
        //console.log(data.message);
      }
    } catch (error) {
      //console.log(error.message);
    }
  };

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {currentUser?.isAdmin && reports.length > 0 ? (
        <>
          <Table hoverable className="shadow-md">
            <Table.Head>
              <Table.HeadCell>Date Reported</Table.HeadCell>
              <Table.HeadCell>Post Title</Table.HeadCell>
              <Table.HeadCell>Reported By</Table.HeadCell>
              <Table.HeadCell>Reason</Table.HeadCell>
              <Table.HeadCell>Comment</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
            </Table.Head>
            {reports.map((report) => (
              <Table.Body className="divide-y" key={report._id}>
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    {report.postId?.title || report.postId?._id}
                  </Table.Cell>
                  <Table.Cell>
                    {report.reporterId?.username || report.reporterId?._id}
                  </Table.Cell>
                  <Table.Cell>{report.reason}</Table.Cell>
                  <Table.Cell>{report.comment || '-'}</Table.Cell>
                  <Table.Cell>{report.status}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setReportIdToDelete(report._id);
                      }}
                      className="font-medium text-green-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </span>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ))}
          </Table>

          {showMore && (
            <button
              onClick={handleShowMore}
              className="w-full text-teal-500 self-center text-sm py-7"
            >
              Show more
            </button>
          )}
        </>
      ) : (
        <p>No reports found.</p>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} popup size="md">
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
            <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this report and its related post?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="success" onClick={handleDeleteReport}>
                Yes, delete both
              </Button>
              <Button color="gray" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
