"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import PostCard from "../components/PostCard"

export default function Flags() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/post/getPosts")
        const data = await res.json()
        // Sort posts by creation date (most recent first)
        const sortedPosts = data.posts.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setPosts(sortedPosts)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Recent Flags</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <div key={post._id} className="border rounded-lg overflow-hidden shadow-sm">
                  <PostCard post={post} />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No flags have been reported yet.</p>
                <Link
                  to="/raise-flags"
                  className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Be the first to raise a flag
                </Link>
              </div>
            )}
          </div>

          {posts && posts.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/search" className="text-green-600 font-medium hover:underline">
                View All Flags
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
