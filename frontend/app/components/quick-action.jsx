import { Button } from "../components/ui/button";
import { PlusCircle, CheckCircle, FileText } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" /> New Mutation
      </Button>
      <Button className="bg-success hover:bg-success text-white">
        <CheckCircle className="mr-2 h-4 w-4" /> Approve Leave
      </Button>
      <Button className="bg-violet hover:bg-violet text-white">
        <FileText className="mr-2 h-4 w-4" /> Generate Report
      </Button>
    </div>
  );
}
