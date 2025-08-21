import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";

import { useEffect, useState } from "react";

export function AbsencesAIList48H() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAIAfter48h = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/getAI-48h`,
          {
            method: "GET",

            credentials: "include",
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Erreur de chargement.");
        }

        const result = await response.json();
        console.log("result", result.data);
        setAbsences(result.data);
      } catch (err) {
        setError(err.message);
        console.error("Erreur fetchAIAfter48h:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAIAfter48h();
  }, []);

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence.id}>
              <TableCell className="font-medium text-black">
                {absence.employee}
              </TableCell>
              <TableCell className="font-medium text-black">
                {absence.fromStation}
              </TableCell>
              <TableCell className="font-medium text-black">
                {absence.toStation}
              </TableCell>
              <TableCell className="font-medium text-black">
                {" "}
                {absence.date}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
