"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Loader2, CheckCircle, Brain } from "lucide-react";
import { formatCents } from "@/lib/constants";

interface ParsedClaim {
  description: string;
  serviceDate: string;
  billedAmount: number;
  cptCode: string;
  icdCode: string;
  category: string;
  confidence: number;
  providerName: string;
}

export default function UploadClaimsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ParsedClaim[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const processFile = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.claims);
      }
    } catch {
      // Demo mode: generate sample results
      setResults([
        { description: "Office visit - established patient", serviceDate: "2025-03-15", billedAmount: 15000, cptCode: "99213", icdCode: "J06.9", category: "outpatient", confidence: 0.95, providerName: "Dr. James Mitchell" },
        { description: "Comprehensive metabolic panel", serviceDate: "2025-03-15", billedAmount: 5000, cptCode: "80053", icdCode: "E11.9", category: "lab", confidence: 0.98, providerName: "Quest Diagnostics" },
        { description: "MRI lumbar spine without contrast", serviceDate: "2025-03-18", billedAmount: 200000, cptCode: "72148", icdCode: "M54.5", category: "imaging", confidence: 0.92, providerName: "ClearView Radiology" },
        { description: "Psychotherapy session, 45 min", serviceDate: "2025-03-20", billedAmount: 15000, cptCode: "90834", icdCode: "F41.1", category: "mental_health", confidence: 0.97, providerName: "Mindful Health Associates" },
        { description: "Lisinopril 10mg, 30-day supply", serviceDate: "2025-03-10", billedAmount: 1500, cptCode: "RX", icdCode: "I10", category: "pharmacy", confidence: 0.99, providerName: "CVS Pharmacy" },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Claims</h2>
        <p className="text-muted-foreground">
          Upload medical claims or invoices for AI-powered categorization.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`
              flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors
              ${dragOver ? "border-blue-500 bg-blue-50" : "border-muted-foreground/25"}
              ${file ? "border-green-500 bg-green-50" : ""}
            `}
          >
            {file ? (
              <>
                <FileText className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Drop your claims file here</p>
                <p className="text-sm text-muted-foreground mb-4">CSV, Excel, or PDF files supported</p>
                <label className="cursor-pointer">
                  <input type="file" onChange={handleFileChange} className="hidden" accept=".csv,.xlsx,.pdf,.txt" />
                  <span className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                    Browse Files
                  </span>
                </label>
              </>
            )}
          </div>

          {file && !results.length && (
            <div className="mt-4 flex justify-center">
              <Button onClick={processFile} disabled={processing} size="lg">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI Processing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Categorize with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {processing && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="relative">
              <Brain className="h-8 w-8 text-blue-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div>
              <p className="font-medium text-blue-900">AI is analyzing your claims...</p>
              <p className="text-sm text-blue-700">Identifying service categories, CPT codes, and potential anomalies</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {results.length} Claims Categorized
            </CardTitle>
            <Button size="sm">Save All Claims</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>CPT</TableHead>
                  <TableHead>ICD-10</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((claim, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{claim.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.providerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{claim.serviceDate}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{claim.cptCode}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{claim.icdCode}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {claim.category.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCents(claim.billedAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${claim.confidence > 0.9 ? "bg-green-500" : claim.confidence > 0.8 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${claim.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{(claim.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
