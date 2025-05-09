import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Repository - WalGit',
  description: 'Create a new repository on WalGit',
};

export default function NewRepositoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Create a new repository</h1>
      
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <form>
          <div className="mb-6">
            <label htmlFor="repo-name" className="block text-sm font-medium text-gray-700 mb-1">
              Repository name*
            </label>
            <input
              type="text"
              id="repo-name"
              name="repo-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="my-new-project"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Great repository names are short, memorable and easy to spell.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Short description of your repository"
            />
          </div>
          
          <div className="mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </legend>
              <div className="mt-2 space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="public"
                      name="visibility"
                      type="radio"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="public" className="font-medium text-gray-700">Public</label>
                    <p className="text-gray-500 text-sm">
                      Anyone can see this repository. You choose who can commit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="private"
                      name="visibility"
                      type="radio"
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="private" className="font-medium text-gray-700">Private</label>
                    <p className="text-gray-500 text-sm">
                      You choose who can see and commit to this repository.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          
          <div className="mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Initialize this repository with:
              </legend>
              <div className="mt-2 space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="add-readme"
                      name="add-readme"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="add-readme" className="font-medium text-gray-700">Add a README file</label>
                    <p className="text-gray-500 text-sm">
                      This is where you can write a description of your project.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="add-gitignore"
                      name="add-gitignore"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="add-gitignore" className="font-medium text-gray-700">Add .gitignore</label>
                    <p className="text-gray-500 text-sm">
                      Specify which files not to track from your repository.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="add-license"
                      name="add-license"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="add-license" className="font-medium text-gray-700">Add a license</label>
                    <p className="text-gray-500 text-sm">
                      A license tells others what they can and can't do with your code.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          
          <div className="border-t pt-6">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create repository
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}