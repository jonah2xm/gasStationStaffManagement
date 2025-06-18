import { Button } from "../components/ui/button";
import { PlusCircle, CheckCircle, FileText } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button className="bg-blue-500 hover:bg-blue-600 text-white">
        <PlusCircle className="mr-2 h-4 w-4" /> New Mutation
      </Button>
      <Button className="bg-green-500 hover:bg-green-600 text-white">
        <CheckCircle className="mr-2 h-4 w-4" /> Approve Leave
      </Button>
      <Button className="bg-purple-500 hover:bg-purple-600 text-white">
        <FileText className="mr-2 h-4 w-4" /> Generate Report
      </Button>
    </div>
  );
}
