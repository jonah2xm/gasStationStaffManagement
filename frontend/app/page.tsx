"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AlertDialogDemo() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleDelete = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false);
      setOpenDialog(null);
      setShowSuccess(true);
    }, 1500);
  };

  return (
    <div className="container mx-auto py-10 space-y-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        Alert Dialog Examples
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Confirmation Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Confirmation</CardTitle>
            <CardDescription>A simple confirmation dialog</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Use this pattern when you need the user to confirm an action that
              doesn't have serious consequences.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Show Dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently perform
                    the action you've requested.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {/* Destructive Action Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Destructive Action</CardTitle>
            <CardDescription>
              Confirmation for destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Use this pattern when the user is about to perform a destructive
              action like deleting data.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog
              open={openDialog === "delete"}
              onOpenChange={(open) => !open && setOpenDialog(null)}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setOpenDialog("delete")}
                >
                  Delete Item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    Are you sure you want to delete this item? This action
                    cannot be undone and all associated data will be permanently
                    removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Success Dialog */}
            <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <AlertDialogTitle>Success</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    The item has been successfully deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowSuccess(false)}>
                    OK
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {/* Information Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Information Alert</CardTitle>
            <CardDescription>Display important information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Use this pattern to display important information that the user
              needs to acknowledge.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Show Information</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Info className="h-5 w-5" />
                    <AlertDialogTitle>Important Information</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    This is an important message that you need to be aware of.
                    Please read it carefully before proceeding.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>I understand</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {/* Error Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Error Alert</CardTitle>
            <CardDescription>Display error information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Use this pattern to display error information that requires user
              attention.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Show Error</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <XCircle className="h-5 w-5" />
                    <AlertDialogTitle>Error Occurred</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    An error occurred while processing your request. Please try
                    again or contact support if the problem persists.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Try Again</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {/* Custom Content Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Content</CardTitle>
            <CardDescription>Dialog with custom content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              You can include any content inside the dialog, including forms,
              images, or other components.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Show Custom Dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Custom Dialog</AlertDialogTitle>
                  <AlertDialogDescription>
                    This dialog contains custom content.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                    <h3 className="font-medium">Custom Content Section</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      You can include any React components or HTML elements
                      here.
                    </p>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-green-500"></div>
                      <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                      <div className="h-4 w-4 rounded-full bg-red-500"></div>
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {/* Controlled Dialog */}
        <Card>
          <CardHeader>
            <CardTitle>Controlled Dialog</CardTitle>
            <CardDescription>
              Programmatically control the dialog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              You can programmatically control the dialog's open state using
              React state.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <AlertDialog
              open={openDialog === "controlled"}
              onOpenChange={(open) => !open && setOpenDialog(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Controlled Dialog</AlertDialogTitle>
                  <AlertDialogDescription>
                    This dialog is controlled programmatically using React
                    state.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              onClick={() => setOpenDialog("controlled")}
            >
              Open Dialog
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
