
"use client";

import { useEffect, useState } from "react";
import { FaBook, FaFlag, FaGlobe, FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import people from "../assets/pinkpeo.png";
import tree from "../assets/tree.png";
import PostCard from "../components/PostCard";

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch("/api/post/getPosts");
      const data = await res.json();
      setPosts(data.posts);
    };
    fetchPosts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero Section */}
      <section className="py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          {/* Left Side Content */}
          <div className="lg:col-span-2 text-center lg:text-left space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold dark:text-white">
              Welcome to BlogTop
            </h1>
            <p className="whitespace-pre text-sm md:text-base text-gray-700 dark:text-gray-300">
              BlogTop is  a platform  where citizens  can  report issues they <br />
              encounter in  their  locality and ensure  about a solution. From <br />
              potholes to broken streetlights, garbage dumps to water leaks <br />
              we connect you with concerned authorities  and empower your <br />
              voice for safer neighborhoods.
            </p>

            <div className="flex justify-center lg:justify-start">
              <img
                src={tree}
                alt="Colorful tree illustration"
                className="w-40 sm:w-48 md:w-52 lg:w-60 h-auto object-contain ml-24"
              />
            </div>
          </div>

          {/* Right Side Image */}
          <div className="lg:col-span-3 flex justify-center">
            <img
              src={people}
              alt="People with flag illustration"
              className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <FaFlag className="text-3xl w-12 h-12 text-gray-800" />,
              title: "Incident Reporting",
              desc: "Your input helps alert others and keep the community informed.",
            },
            {
              icon: <FaBook className="text-3xl w-12 h-12 text-gray-800" />,
              title: "Community Blog Posts",
              desc: "See where incidents are happening and stay aware of danger zones.",
            },
            {
              icon: <FaGlobe className="text-3xl w-12 h-12 text-gray-800" />,
              title: "Location Specific Awareness",
              desc: "Share updates or safety tips with others through blog-style posts.",
            },
            {
              icon: <FaShieldAlt className="text-3xl w-12 h-12 text-gray-800" />,
              title: "User Privacy Controls",
              desc: "Post anonymously or control location details — your safety first.",
            },
          ].map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center px-4">
              <div className="bg-white p-4 rounded-full mb-4 shadow-md">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Help Section */}
      <section className="py-6 flex justify-center">
        <div className="text-center mt-8">
          <Link to="/help" className="text-green-600 font-medium hover:underline">
            Help and Contact
          </Link>
        </div>
      </section>

      {/* Trending Flags Section */}
      <section className="py-10">
        {posts && posts.length > 0 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl md:text-2xl font-bold mb-6 dark:text-white">
              Trending Flags
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/search" className="text-green-600 font-medium hover:underline">
                View All Flags
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
