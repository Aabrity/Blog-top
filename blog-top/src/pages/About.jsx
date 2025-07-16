

export default function About() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='max-w-2xl mx-auto p-1 text-center -translate-y-12'>
        <div>
          <h1 className='text-3xl font font-semibold text-center my-7'>
            About RatoJhanda
          </h1>
          <div className='text-md text-gray-700 dark:text-white flex flex-col gap-6'>
            <p>
             Ratoflag is a community-powered platform built to keep you safe, informed, and connected.
              In a world where important local incidents often go unnoticed, Ratoflag helps people share
               real-time reports about what's happening around them. From suspicious activities and safety 
               concerns to lost and found items, we give everyday people the power to raise red flags and
                alert others through a shared map and blog-style posts.
            </p>

            <p>
              Our mission is simple:
              To make neighborhoods safer and more aware through the power of shared information.
                We believe that everyone has the right to feel secure and informed in their surroundings.
                 Whether you’ve seen something odd, lost something important, or just want to help others 
                 stay alert  Ratoflag gives you a voice. No complicated signups or fancy tech talk 
                  just real people helping each other in real time.

            </p>

            <h2>
             What Makes Ratoflag Different?
            </h2>

            <p>
               Community-Driven: Every post, flag, and update comes from people like you.
               Map-Based Alerts: Visualize danger zones and incident areas instantly.
              Lost & Found Friendly: Help return items to their rightful owners.
              Simple & Anonymous: Share your story safely  even without revealing who you are.
              We’re here to build safer streets, more caring communities, and a tool anyone can use young or old, tech-savvy or not.
            </p>
          </div>
        </div>
       
      </div>
    </div>
  );
}