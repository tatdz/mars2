import React, { useState } from "react";
import { useValidators } from "@/hooks/useValidators";
import { scoreValidator, getScoreColor, getScoreColorClass, getStatusColor, getStatusText, getNextActionMessage } from "@/lib/scoring";
import { formatAddress } from "@/lib/crypto";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReportModal } from "@/components/ReportModal";
import { AlertTriangle, Info, RefreshCw, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ValidatorTable() {
  const { validators, isLoading, isError, refetch } = useValidators();
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showAllValidators, setShowAllValidators] = useState(false);
  const [selectedValidatorDetails, setSelectedValidatorDetails] = useState<any>(null);
  
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
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="bg-white text-black border-gray-300 hover:bg-gray-100"
            >
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
                  // Use the Mars² score if available, otherwise calculate
                  const score = validator.mars_score || scoreValidator(validator);
                  const scoreColor = getScoreColor(score);
                  const scoreColorClass = getScoreColorClass(score);
                  const statusColor = getStatusColor(validator.mars_status || validator.status, validator.jailed);
                  const statusText = getStatusText(validator.mars_status || validator.status, validator.jailed);

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
                          {validator.uptime ? validator.uptime.toFixed(1) : (validator.uptime || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-white">{validator.missed_blocks || validator.recent_reports || 0}</span>
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
                            size="default"
                            onClick={() => handleReportClick(validator.operator_address)}
                            className="text-validator-yellow hover:text-yellow-300 hover:bg-validator-yellow/10 h-10 px-4"
                            title="Report an incident for this validator"
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="default"
                            onClick={() => setSelectedValidatorDetails(validator)}
                            className="text-sei-blue hover:text-blue-300 hover:bg-sei-blue/10 h-10 px-4"
                            title="View detailed score explanation"
                          >
                            <Info className="w-5 h-5" />
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

      {/* Validator Details Modal */}
      <Dialog open={!!selectedValidatorDetails} onOpenChange={() => setSelectedValidatorDetails(null)}>
        <DialogContent className="bg-dark-card border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedValidatorDetails?.description.moniker} - Score Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedValidatorDetails && (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  <span className={getScoreColorClass(scoreValidator(selectedValidatorDetails))}>
                    {scoreValidator(selectedValidatorDetails)}
                  </span>
                </div>
                <div className="text-lg text-gray-300">
                  {getNextActionMessage(scoreValidator(selectedValidatorDetails)).title}
                </div>
              </div>

              {/* Plain English Explanation */}
              <Card className="bg-dark-bg border-gray-600">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-white mb-3">What this score means for stakers:</h3>
                  <div className="space-y-2 text-gray-300">
                    {scoreValidator(selectedValidatorDetails) >= 80 ? (
                      <>
                        <p>✅ This validator has excellent performance and is safe for staking.</p>
                        <p>• High uptime ({(selectedValidatorDetails.uptime || 0).toFixed(1)}%)</p>
                        <p>• Reliable block production</p>
                        <p>• No recent incidents</p>
                        <p>• Your rewards should be consistent</p>
                      </>
                    ) : scoreValidator(selectedValidatorDetails) >= 50 ? (
                      <>
                        <p>⚠️ This validator has moderate performance. Monitor closely if staking.</p>
                        <p>• Uptime could be better ({(selectedValidatorDetails.uptime || 0).toFixed(1)}%)</p>
                        <p>• Some missed blocks ({selectedValidatorDetails.missed_blocks || 0})</p>
                        <p>• May affect your staking rewards</p>
                        <p>• Consider diversifying your stake</p>
                      </>
                    ) : (
                      <>
                        <p>🚨 This validator has poor performance. Consider unstaking immediately.</p>
                        <p>• Low uptime ({(selectedValidatorDetails.uptime || 0).toFixed(1)}%)</p>
                        <p>• High number of missed blocks ({selectedValidatorDetails.missed_blocks || 0})</p>
                        <p>• High risk of slashing</p>
                        <p>• Your staked funds may be at risk</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card className="bg-dark-bg border-gray-600">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-white mb-3">Score Breakdown:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Uptime (40% weight)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{(selectedValidatorDetails.uptime || 0).toFixed(1)}%</span>
                        {(selectedValidatorDetails.uptime || 0) >= 99 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (selectedValidatorDetails.uptime || 0) >= 95 ? (
                          <Minus className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Block Production (30% weight)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{selectedValidatorDetails.missed_blocks || 0} missed blocks</span>
                        {(selectedValidatorDetails.missed_blocks || 0) <= 5 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (selectedValidatorDetails.missed_blocks || 0) <= 20 ? (
                          <Minus className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status (20% weight)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{getStatusText(selectedValidatorDetails.status, selectedValidatorDetails.jailed)}</span>
                        {!selectedValidatorDetails.jailed && selectedValidatorDetails.status === "BOND_STATUS_BONDED" ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Community Reports (10% weight)</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">No incidents</span>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setSelectedValidatorDetails(null);
                    handleReportClick(selectedValidatorDetails.operator_address);
                  }}
                  variant="outline"
                  className="flex-1 border-validator-yellow text-validator-yellow hover:bg-validator-yellow/10"
                >
                  Report an Incident
                </Button>
                <Button
                  onClick={() => setSelectedValidatorDetails(null)}
                  className="flex-1 bg-purple-accent hover:bg-purple-accent/90"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}