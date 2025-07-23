import { Card, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto pl-14 px-6 py-8 space-y-6">
      <Link
        to="/"
        className="text-sm text-black hover:underline hover:text-green-800"
      >
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold text-center text-black dark:text-white">
        Help
      </h1>

      <Card className="border-2 border-green-500 rounded-md shadow-sm">
        <h2 className="font-semibold text-black dark:text-white">
          How do I post?
        </h2>
        <p className="text-black dark:text-gray-300">
          Click Raise Flags. Fill out the information. Click RaiseFlag.
        </p>
      </Card>

      <Card className="border-2 border-green-500 rounded-md shadow-sm">
        <h2 className="font-semibold text-black dark:text-white">
          How do I comment?
        </h2>
        <p className="text-black dark:text-gray-300">
          Click the comment button under any post. Type and submit.
        </p>
      </Card>

      <Card className="border-2 border-green-500 rounded-md shadow-sm">
        <h2 className="font-semibold text-black dark:text-white">
          How do I report something?
        </h2>
        <p className="text-black dark:text-gray-300">
          Click the report icon on the right of a flag raised. Choose your
          reason. Submit report.
        </p>
      </Card>

      <Card className="border-2 border-green-500 rounded-md shadow-sm">
        <h2 className="font-semibold text-black dark:text-white">
          How do I edit my profile?
        </h2>
        <p className="text-black dark:text-gray-300">
          Click your avatar. Go to Profile. Make changes.
        </p>
      </Card>

     <Card className="border-2 border-green-500 rounded-md shadow-sm text-center">
  <h2 className="font-semibold text-black dark:text-white">
    Need More Help?
  </h2>
  <div className="flex justify-center mt-2">
    <Link to="/contact">
      <Button color="success">
        Contact Us
      </Button>
    </Link>
  </div>
</Card>

    </div>
  );
}
