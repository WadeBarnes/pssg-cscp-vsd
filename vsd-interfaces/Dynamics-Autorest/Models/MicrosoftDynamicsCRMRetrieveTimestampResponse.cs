// <auto-generated>
// Code generated by Microsoft (R) AutoRest Code Generator.
// Changes may cause incorrect behavior and will be lost if the code is
// regenerated.
// </auto-generated>

namespace Gov.Jag.VictimServices.Interfaces.Models
{
    using Newtonsoft.Json;
    using System.Linq;

    /// <summary>
    /// RetrieveTimestampResponse
    /// </summary>
    public partial class MicrosoftDynamicsCRMRetrieveTimestampResponse
    {
        /// <summary>
        /// Initializes a new instance of the
        /// MicrosoftDynamicsCRMRetrieveTimestampResponse class.
        /// </summary>
        public MicrosoftDynamicsCRMRetrieveTimestampResponse()
        {
            CustomInit();
        }

        /// <summary>
        /// Initializes a new instance of the
        /// MicrosoftDynamicsCRMRetrieveTimestampResponse class.
        /// </summary>
        public MicrosoftDynamicsCRMRetrieveTimestampResponse(string timestamp = default(string))
        {
            Timestamp = timestamp;
            CustomInit();
        }

        /// <summary>
        /// An initialization method that performs custom operations like setting defaults
        /// </summary>
        partial void CustomInit();

        /// <summary>
        /// </summary>
        [JsonProperty(PropertyName = "Timestamp")]
        public string Timestamp { get; set; }

    }
}