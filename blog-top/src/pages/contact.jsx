
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, TextInput, Textarea } from 'flowbite-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ContactPage() {
  const { currentUser } = useSelector((state) => state.user);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const customInputTheme = {
    field: {
      input: {
        base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
        colors: {
          gray:
            "bg-white border-red-400 text-black focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-red-600 dark:text-white",
        },
      },
    },
    textarea: {
      base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
      colors: {
        gray:
          "bg-red-50 border-red-400 text-black focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-red-600 dark:text-white",
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message cannot be empty');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          subject,
          message,
        }),
      });

      if (res.ok) {
        toast.success('Email sent successfully!');
        setSubject('');
        setMessage('');
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to send email.');
      }
    } catch (error) {
      toast.error('Error sending email.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-red-600 text-lg font-semibold">
          You must be signed in to contact us.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-10 mb-10 border-2 border-red-500 rounded-md shadow-sm bg-white dark:bg-gray-900">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6 text-black dark:text-white text-center">
        Contact Admin
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="userEmail"
            className="block mb-2 text-sm font-semibold text-black dark:text-white"
          >
            Your Email
          </label>
          <TextInput
            id="userEmail"
            type="email"
            value={currentUser.email}
            disabled
            className="bg-white border border-red-400 text-black dark:bg-gray-700 dark:border-red-600 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="block mb-2 text-sm font-semibold text-black dark:text-white"
          >
            Subject
          </label>
          <TextInput
            id="subject"
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            theme={customInputTheme}
            color="gray"
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block mb-2 text-sm font-semibold text-black dark:text-white"
          >
            Message
          </label>
          <TextInput
            id="message"
            placeholder="Write your message here..."
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            theme={customInputTheme}
            color="gray"
          />
        </div>
        <Button color="failure" type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
      </form>
    </div>
  );
}
