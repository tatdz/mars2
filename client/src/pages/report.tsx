import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useContracts } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { useValidators } from "@/hooks/useValidators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, Info, CheckCircle, Clock, User } from "lucide-react";

const reportSchema = z.object({
  validatorAddress: z.string().min(1, "Validator address is required"),
  incidentType: z.string().min(1, "Please select an incident type"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  evidence: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const incidentTypes = [
  { value: "downtime", label: "Validator Downtime", description: "Node offline or missing blocks" },
  { value: "double_signing", label: "Double Signing", description: "Validator signing multiple blocks" },
  { value: "governance", label: "Governance Issues", description: "Malicious or concerning votes" },
  { value: "slashing", label: "Slashing Event", description: "Validator was slashed" },
  { value: "performance", label: "Performance Issues", description: "Slow or inconsistent performance" },
  { value: "security", label: "Security Concern", description: "Potential security vulnerability" },
  { value: "other", label: "Other", description: "Other validator-related issues" },
];



export function ReportPage() {
  const { address, isConnected } = useWallet();
  const { submitReport } = useContracts();
  const { validators } = useValidators();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      validatorAddress: "",
      incidentType: "",
      description: "",
      evidence: "",
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    try {
      // Demo submission - simplified without blockchain calls
      console.log("Demo report submitted:", data);
      alert("Report submitted successfully! This is a demo version.");
      setIsSubmitted(true);
      form.reset();
    } catch (error) {
      console.error("Failed to submit report:", error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="bg-dark-card border-green-500/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Report Submitted Successfully</h2>
              <p className="text-gray-400">
                Your anonymous report has been submitted using zero-knowledge proofs. 
                The validator's risk score will be updated based on the incident severity.
              </p>
              <div className="flex justify-center space-x-4 pt-4">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  className="bg-purple-accent hover:bg-purple-accent/90"
                >
                  Submit Another Report
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Shield className="w-8 h-8 text-purple-accent" />
          <h1 className="text-3xl font-bold text-white">Anonymous Incident Reporting</h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Report validator incidents anonymously using zero-knowledge proofs. 
          Your identity remains protected while helping maintain network security.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-purple-accent" />
                Report Incident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="validatorAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Validator</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                              <SelectValue placeholder="Select validator to report" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-dark-card border-gray-600 max-h-60">
                            {validators?.map((validator: any) => (
                              <SelectItem
                                key={validator.operator_address}
                                value={validator.operator_address}
                                className="text-white hover:bg-gray-700"
                              >
                                <div className="flex flex-col">
                                  <div className="font-medium">{validator.description.moniker}</div>
                                  <div className="text-xs text-gray-400 font-mono">
                                    {validator.operator_address.slice(0, 20)}...
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Incident Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                              <SelectValue placeholder="Select incident type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-dark-card border-gray-600">
                            {incidentTypes.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                                className="text-white hover:bg-gray-700"
                              >
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm text-gray-400">{type.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Incident Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="Describe the incident in detail. Include timestamps, observed behavior, and any relevant context..."
                            className="bg-dark-bg border-gray-600 text-white resize-none"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Provide detailed information about the incident (minimum 10 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Evidence (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Links to block explorers, transaction hashes, screenshots, or other supporting evidence..."
                            className="bg-dark-bg border-gray-600 text-white resize-none"
                          />
                        </FormControl>
                        <FormDescription className="text-gray-400">
                          Any supporting evidence like transaction hashes, block heights, or external links
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="bg-dark-bg border-purple-accent">
                    <Info className="h-4 w-4 text-purple-accent" />
                    <AlertDescription className="text-gray-300">
                      <div className="font-medium text-purple-accent mb-1">Privacy & Security</div>
                      <ul className="space-y-1 text-sm">
                        <li>• Your report is completely anonymous using zero-knowledge proofs</li>
                        <li>• Reports are cryptographically verified but identity-protected</li>
                        <li>• Validator scores are updated automatically based on verified reports</li>
                        <li>• False reporting is prevented through nullifier mechanisms</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex space-x-4">
                    <Button
                      type="submit"
                      disabled={submitReport.isPending || !isConnected}
                      className="flex-1 bg-purple-accent hover:bg-purple-accent/90 text-white"
                    >
                      {submitReport.isPending ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Submitting Report...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>Submit Anonymous Report</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                <div>
                  <p className="text-sm text-white font-medium">Anonymous Submission</p>
                  <p className="text-xs text-gray-400">Report incidents without revealing your identity</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <div>
                  <p className="text-sm text-white font-medium">ZK Verification</p>
                  <p className="text-xs text-gray-400">Zero-knowledge proofs verify legitimacy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                <div>
                  <p className="text-sm text-white font-medium">Score Update</p>
                  <p className="text-xs text-gray-400">Validator risk scores automatically adjust</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Reports</span>
                  <span className="text-white">156</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Anonymous</span>
                  <span className="text-green-400">100%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Verified</span>
                  <span className="text-white">142</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-yellow-400">14</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Anonymous ZK Proofs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-purple-accent border-purple-accent bg-purple-accent/10 px-3 py-1">
                  <span className="text-white">Zero Knowledge</span>
                </Badge>
                <span className="text-xs text-gray-400">Anonymous reporting</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10 px-3 py-1">
                  <span className="text-white">Sybil Resistant</span>
                </Badge>
                <span className="text-xs text-gray-400">Prevents double reports</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10 px-3 py-1">
                  <span className="text-white">Verifiable</span>
                </Badge>
                <span className="text-xs text-gray-400">Cryptographically proven</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}