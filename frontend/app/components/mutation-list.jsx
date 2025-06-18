import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

const recentMutations = [
  {
    id: 1,
    employee: "John Doe",
    fromStation: "Station A",
    toStation: "Station B",
    date: "2024-01-25",
    status: "Completed",
  },
  {
    id: 2,
    employee: "Jane Smith",
    fromStation: "Station C",
    toStation: "Station D",
    date: "2024-01-24",
    status: "In Progress",
  },
  {
    id: 3,
    employee: "Bob Johnson",
    fromStation: "Station B",
    toStation: "Station A",
    date: "2024-01-23",
    status: "Pending",
  },
];

export function MutationList() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-gray-800">
              Employee
            </TableHead>
            <TableHead className="font-semibold text-gray-800">From</TableHead>
            <TableHead className="font-semibold text-gray-800">To</TableHead>
            <TableHead className="font-semibold text-gray-800">Date</TableHead>
            <TableHead className="font-semibold text-gray-800">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentMutations.map((mutation) => (
            <TableRow key={mutation.id}>
              <TableCell className="font-medium text-black">
                {mutation.employee}
              </TableCell>
              <TableCell className="font-medium text-black">
                {mutation.fromStation}
              </TableCell>
              <TableCell className="font-medium text-black">
                {mutation.toStation}
              </TableCell>
              <TableCell className="font-medium text-black">
                {" "}
                {mutation.date}
              </TableCell>
              <TableCell className="font-medium text-black">
                <Badge
                  variant={
                    mutation.status === "Completed"
                      ? "success"
                      : mutation.status === "In Progress"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {mutation.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
