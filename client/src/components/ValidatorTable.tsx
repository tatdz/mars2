import React, { useState } from "react";
import { useValidators } from "@/hooks/useValidators";
import { scoreValidator, getScoreColor, getScoreColorClass, getStatusColor, getStatusText, getNextActionMessage } from "@/lib/scoring";
import { formatAddress } from "@/lib/crypto";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReportModal } from "@/components/ReportModal";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ValidatorTable() {
  const { validators, isLoading, isError, refetch } = useValidators();
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showAllValidators, setShowAllValidators] = useState(false);
  
  const displayedValidators = showAllValidators ? validators : validators.slice(0, 5);

  const handleReportClick = (validatorAddress: string) => {
    setSelectedValidator(validatorAddress);
    setIsReportModalOpen(true);
  };

  if (isError) {
    return (
      <Card className="bg-dark-card border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-validator-red mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">Failed to Load Validators</h3>
            <p className="text-gray-400 mb-4">
              Unable to fetch validator data from the Sei network.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Legend */}
      <Card className="bg-dark-card border-gray-700">
        <CardContent className="pt-4">
          <h3 className="font-semibold mb-3 text-white">Score Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-validator-green rounded"></div>
              <span className="text-sm text-gray-300">80-100: Stake freely</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-validator-yellow rounded"></div>
              <span className="text-sm text-gray-300">50-79: Monitor closely</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-validator-red rounded"></div>
              <span className="text-sm text-gray-300">0-49: Unstake</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validator Table */}
      <Card className="bg-dark-card border-gray-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Validator</TableHead>
                <TableHead className="text-gray-300">Score</TableHead>
                <TableHead className="text-gray-300">Uptime</TableHead>
                <TableHead className="text-gray-300">Missed Blocks</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-gray-700">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div>
                          <Skeleton className="w-24 h-4 mb-1" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <Skeleton className="w-8 h-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-12 h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-8 h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Skeleton className="w-8 h-8" />
                        <Skeleton className="w-8 h-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : validators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-gray-400">
                      No validators found. Check your network connection.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedValidators.map((validator) => {
                  const score = scoreValidator(validator);
                  const scoreColor = getScoreColor(score);
                  const scoreColorClass = getScoreColorClass(score);
                  const statusColor = getStatusColor(validator.status, validator.jailed);
                  const statusText = getStatusText(validator.status, validator.jailed);

                  return (
                    <TableRow 
                      key={validator.operator_address}
                      className="border-gray-700 hover:bg-gray-700/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-sei-blue rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {validator.description.moniker.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{validator.description.moniker}</div>
                            <div className="text-sm text-gray-400">
                              {formatAddress(validator.operator_address)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-12 relative">
                            <svg className="w-12 h-12 transform -rotate-90">
                              <circle
                                cx="24"
                                cy="24"
                                r="16"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-gray-600"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="16"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={100.53}
                                strokeDashoffset={100.53 - (100.53 * score) / 100}
                                className={scoreColorClass}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-sm font-bold ${scoreColorClass}`}>
                                {score}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`${scoreColorClass} font-medium`}>
                          {(validator.uptime || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-white">{validator.missed_blocks || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${statusColor} border-current`}
                        >
                          {statusText}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportClick(validator.operator_address)}
                            className="text-validator-yellow hover:text-yellow-300 hover:bg-validator-yellow/10"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sei-blue hover:text-blue-300 hover:bg-sei-blue/10"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Load All Validators Button */}
        {!showAllValidators && validators.length > 5 && (
          <div className="p-4 border-t border-gray-700 text-center">
            <Button
              onClick={() => setShowAllValidators(true)}
              variant="outline"
              className="bg-sei-blue hover:bg-sei-blue/90 text-white border-sei-blue"
            >
              Load All Validators ({validators.length})
            </Button>
          </div>
        )}
      </Card>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        validatorAddress={selectedValidator}
        validators={validators}
      />
    </div>
  );
}