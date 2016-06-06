/*jshint expr: true*/
"use strict";

//import
var Promise = require('bluebird');
var azure_storage = (require("../../app/lib/azure_blob_storage"));
var expect = require("chai").expect;
var assert = require("chai").assert;
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var nconf = require('nconf');

const TEST_FOLDER = path.join(__dirname, "..");
const BLOB_FILE_NAME = 'shakespeare.txt';
const BLOB_UPLOAD_DIR_PATH = path.join(TEST_FOLDER, "upload");
const BLOB_DOWNLOAD_DIR_PATH = path.join(TEST_FOLDER, "download");
const BLOB_FILE_PATH = path.join(BLOB_UPLOAD_DIR_PATH, BLOB_FILE_NAME);
const AZURE_CONTAINER_NAME = crypto.randomBytes(5).toString('hex');
const AZURE_CONFIG_DIR_PATH = path.join(TEST_FOLDER, "config");

// Azure accesskey and storage account

nconf.argv().env().file({file: path.join(AZURE_CONFIG_DIR_PATH, "config.json")});
var nconf = require('nconf');
nconf
    .env()
    .file(
        {file: path.join(AZURE_CONFIG_DIR_PATH, "config.json")});

const ACCESS_KEY = nconf.get("AZURE_STORAGE_ACCESS_KEY");
const STORAGE_ACCOUNT = nconf.get("AZURE_STORAGE_ACCOUNT");


// create promise on fs and azure wrapper library
var fs = Promise.promisifyAll(fs);
var azure_storage = Promise.promisifyAll(azure_storage);


describe("Azure Blob Storage Promise", function () {
    var azureBlobService = null;
    describe("Creating Azure Blob Service", function () {
        beforeEach(function () {
            azureBlobService = azure_storage.blobService(STORAGE_ACCOUNT, ACCESS_KEY);
        });

        it("should not be null", function () {
            expect(azureBlobService).not.to.be.null;
        });

        describe("Creating Azure container: " + AZURE_CONTAINER_NAME, function () {
            describe("If already exists", function () {
                it("should succed", function (done) {
                    azure_storage.createContainerIfNotExistsAsync(azureBlobService, AZURE_CONTAINER_NAME)
                        .then(function (result) {
                            assert.equal(result.status, azure_storage.RESULT_STATUS_SUCCESS);
                        })
                        .done(done, done);
                });
            });

            describe("Blob storage CRUD", function () {
                describe("Listing blobs", function () {
                    it("should return no entries", function (done) {
                        azure_storage.listBlobsAsync(azureBlobService, AZURE_CONTAINER_NAME)
                            .then(function (result) {
                                assert.equal(result.numEntries, 0, "There should be 0 blobs");
                            })
                            .done(done, done);
                    });
                });

                describe("Uploading existing local file: " + BLOB_FILE_NAME, function () {
                    it("should succeed", function (done) {

                        this.timeout(5000);
                        var stats = fs.statSync(BLOB_FILE_PATH);
                        var fileSizeInBytes = stats.size;
                        var readStream = fs.createReadStream(BLOB_FILE_PATH);
                        azure_storage.uploadBlobFromStreamAsync(azureBlobService, AZURE_CONTAINER_NAME, BLOB_FILE_NAME, readStream, fileSizeInBytes)
                            .then(function (result) {
                                readStream.close();
                                assert.equal(result.status, azure_storage.RESULT_STATUS_SUCCESS);
                            }).done(done, done);
                    });
                });

                describe("Listing blobs", function () {
                    it("should return one entries", function (done) {
                        azure_storage.listBlobsAsync(azureBlobService, AZURE_CONTAINER_NAME)
                            .then(function (result) {
                                assert.equal(result.numEntries, 1, "There should be 1 blob");
                            }).catch(function (err) {
                                assert.fail(0,1,err.message);
                            })
                            .done(done, done);
                    });
                });

                describe("Downloading existing blob: " + BLOB_FILE_NAME, function () {
                    it("should succeed", function (done) {
                        var downloadFileName = path.join(BLOB_DOWNLOAD_DIR_PATH, BLOB_FILE_NAME);
                        var writeStream = fs.createWriteStream(downloadFileName);
                        var stats = fs.statSync(BLOB_DOWNLOAD_DIR_PATH);

                        azure_storage.downloadBlobAsync(azureBlobService, AZURE_CONTAINER_NAME, BLOB_FILE_NAME, writeStream, null)
                            .then(function (result) {
                                assert.equal(result.status, azure_storage.RESULT_STATUS_SUCCESS);
                            }).done(done, done);
                    });
                });

                describe("Deleting existing blob: " + BLOB_FILE_NAME, function () {
                    it("should succeed", function (done) {

                        azure_storage.deleteBlobAsync(azureBlobService, AZURE_CONTAINER_NAME, BLOB_FILE_NAME, null)
                            .then(function (result) {
                                assert.equal(result.status, azure_storage.RESULT_STATUS_SUCCESS);
                            }).done(done, done);
                    });
                });

                describe("Listing blobs", function () {
                    it("should return 0 entries", function (done) {
                        azure_storage.listBlobsAsync(azureBlobService, AZURE_CONTAINER_NAME)
                            .then(function (result) {
                                assert.equal(result.numEntries, 0, "There should be 0 blobs");
                            })
                            .done(done, done);
                    });
                });
            });
        });

        describe("Deleting container: " + AZURE_CONTAINER_NAME, function () {
            describe("If exists", function () {
                it("should Succeed", function (done) {
                    azure_storage.deleteContainerIfExistsAsync(azureBlobService, AZURE_CONTAINER_NAME)
                        .then(function (result) {
                            assert.equal(result.status, azure_storage.RESULT_STATUS_SUCCESS, "the status should be SUCCESS");
                        })
                        .done(done, done);
                });
            });
        });
    });
});